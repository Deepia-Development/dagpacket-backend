const mqtt = require('mqtt');

// Configuración del broker MQTT
const options = {
  host: 'ee8e8c5f4fa2484aa2346e9b1bd70e7e.s2.eu.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts',
  username: 'hivemq.webclient.1722874200461',
  password: '<aH2#1STL0wJk?sz@h3I'
};

// Conectar al broker
const client = mqtt.connect(options);

client.on('connect', () => {
  console.log('Conectado al broker MQTT');
  
  // Suscribirse a un topic
  client.subscribe('locker/pc1/confirm', (err) => {
    if (!err) {
      console.log('Suscrito a locker/pc1/confirm');
    }
  });
  
  // Publicar un mensaje
  client.publish('locker/pc1/sendLocker', '1');
});

client.on('message', (topic, message) => {
  // Mensaje recibido
  console.log(`Mensaje recibido en ${topic}: ${message.toString()}`);
});

client.on('error', (err) => {
  console.error('Error de conexión:', err);
});

client.on('close', () => {
  console.log('Conexión cerrada');
});