const EmidaService = require('./emidaService')

const DEFAULT_CONFIG ={
    INITIAL_TIMEOUT: 35000, // 35 seconds
    RETRY_INTERVAL: 15000, // 15 seconds
    MAX_RETRIES: 4, // 4 retries
    TOTAL_TIMEOUT: 90000, // 90 seconds
}


class EmidaTimeoutHandler {
    constructor(emidaService,config ={}){
    this.emidaService = emidaService
    this.config = {...DEFAULT_CONFIG, ...config}
    }
}