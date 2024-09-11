const mqtt = require('mqtt');

class MqttService {
  constructor() {
    this.client = null;
    this.options = {
      host: 'ee8e8c5f4fa2484aa2346e9b1bd70e7e.s2.eu.hivemq.cloud',
      port: 8883,
      protocol: 'mqtts',
      username: 'hivemq.webclient.1722874200461',
      password: '<aH2#1STL0wJk?sz@h3I>',
      rejectUnauthorized: false
    };
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(this.options);

      this.client.on('connect', () => {
        console.log('Conectado al broker MQTT');
        resolve();
      });

      this.client.on('error', (error) => {
        console.log('Error de conexión:', error);
        reject(error);
      });
    });
  }

  publish(topic, message) {
    return new Promise((resolve, reject) => {
      this.client.publish(topic, message, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  subscribe(topic, onMessage) {
    return new Promise((resolve, reject) => {
      this.client.subscribe(topic, (error) => {
        if (error) {
          reject(error);
        } else {
          this.client.on('message', (topic, message) => {
            onMessage(topic, message.toString());
          });
          resolve();
        }
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      this.client.end(() => {
        resolve();
      });
    });
  }
}

module.exports = MqttService;