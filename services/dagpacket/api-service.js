import axios from "axios";
import config from "../../../config/config.js";


class ApiDagpacketService {
    constructor() {
        this.apiUrl = config.apiDagpacket.apiUrl;
        this.username = config.apiDagpacket.username;
        this.password = config.apiDagpacket.password;
        this.expiresIn = null;
        this.token = null;
    }


    async authenticate() {
        try {
            const response = await axios.post(`${this.apiUrl}/auth/login`, {
                username: this.username,
                password: this.password,
            });
            this.token = response.data.token;
            this.expiresIn = response.data.expiresIn;
        } catch (error) {
            console.error("Error authenticating with API Dagpacket:", error);
        }
    }

    async getUsers(){
        try {
            if (!this.token) {
                await this.authenticate();
            }

            const response = await axios.get(`${this.apiUrl}/users/get`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching users from API Dagpacket:", error);
        }
    }


}


