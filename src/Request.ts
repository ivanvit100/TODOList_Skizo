// Description: File with class for working with requests to the server
// All methods are asynchronous and use the fetch API
// This file is part of the "Todo" module for "Skizo" project
// Author: ivanvit100 @ GitHub
// Licence: MIT

import { Task, TaskList } from "./Tasks.js";
import { Interface } from "./Interface.js";

export class Request {
    private login: string;
    private password: string;
    private UI: Interface;
    constructor(UI: Interface) {
        this.login = "";
        this.password = "";
        this.UI = UI;
    }
    // Function for sending a request to the server
    // Also displays a notification if the request has correct message
    // Input: path - the path to the api method
    //        data - the data to be sent to the server
    // Output: json object with the server response
    //         If the request fails, an error is thrown
    async response(path: string, data: object){
        const response = await fetch(path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok)
            throw new Error(`[response]: HTTP Error (${response.status})`);
        else{
            const data = await response.json();
            typeof data.message == "string" && this.UI.notification(data.message, data.status);
            return data;
        }
    }
    // Function for getting the configuration from the server
    // Executes scripts that depend on the contents of the config
    // Input: none
    // Output: none
    async getConfig() {
        const data = await this.response('/api/config', {});
        if (data.status === "success" && data["message"]["color-date-alert"]) {
            let link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = './public/css/color-date-alert.css';
            document.head.appendChild(link);
        }
        if(data.login){
            const hide = document.querySelector(".modal") as HTMLDivElement;
            hide.style.display = "none";
            this.login = data.login;
            this.getTaskListList();
        }
        this.UI.setLang(data.message.lang);
    }
    // Function for user authentication
    // TaskList and TaskManager are loaded only after successful authentication
    // Input: none
    // Output: none
    async auth() {
        try {
            const loginInp = document.querySelector("#modal-login") as HTMLInputElement;
            const passwordInp = document.querySelector("#modal-password") as HTMLInputElement;
            this.login = loginInp.value.trim();
            this.password = passwordInp.value.trim();
            if(this.login === "" || this.password === ""){
                this.UI.notification("Заполните поля", "error");
                throw new Error(`Login or password is empty`);
            }
            const body = {
                login: this.login,
                password: this.password
            }
            const data = await this.response('/api/auth', body);
            if(data.status === "success"){
                const hide = document.querySelector(".modal") as HTMLDivElement;
                hide.style.display = "none";
                this.getTaskListList();
            }
        } catch (error: any) {
            console.error(`[auth]: ${error.message}`);
        }
    }
    // Function for saving current TaskList to the server
    // Input: none
    // Output: none
    async saveTaskList() {
        try{
            const body = {
                taskList: this.UI.getTaskList()?.name,
                data: {"data": this.UI.getTaskList()?.getTasks()}
            }
            await this.response('/api/saveTaskList', body);
            this.UI.setTask(undefined);
            this.UI.updateTaskUI();
            this.UI.updateListUI();
        } catch (error: any) {
            console.error(`[saveTaskList]: ${error.message}`);
        }
    }
    // Function for getting the list of TaskLists
    // Used to load the TaskManager and refill the TaskLists
    // Input: none
    // Output: none
    async getTaskListList() {
        try{
            const data = await this.response('/api/getTaskListList', {});
            for(let i = 0; i < data.message.length; i++){
                let tl = new TaskList(data.message[i]);
                this.UI.getTaskManager().addList(tl);
                this.UI.setTaskList(tl);
                await this.getTaskList(data.message[i]);
            }
            this.UI.updateManagerUI();
        } catch (error: any) {
            console.error(`[getTaskListList]: ${error.message}`);
        }
    }
    // Function for getting the contents of the TaskList
    // Called from this.getTaskListList()
    // Input: name - the name of the TaskList
    // Output: none
    async getTaskList(name: string = "default") {
        try{
            const body = {
                taskList: name
            }
            const data = await this.response('/api/getTaskList', body);
            let ar = data.message.data;
            for(let i = 0; i < ar.length; i++){
                let newTask = new Task(ar[i].name, ar[i].description, ar[i].done, ar[i].date, ar[i].lvl);
                this.UI.getTaskList()?.addTask(newTask);
            }
        } catch (error: any) {
            console.error(`[getTaskList]: ${error.message}`);
        }
    }
    // Function for getting the contents of the TaskList
    // Called from this.getTaskListList()
    // Input: name - the name of the TaskList
    // Output: status of the operation
    async deleteList(name: string) {
        const body = {
            taskList: name
        }
        const data = await this.response('/api/deleteList', body);
        return data.message === "success";
    }
}