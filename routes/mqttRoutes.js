const express = require('express');
const mqtt = require('mqtt');

const router = express.Router();

const mqttOptions = {
  host: 'ee8e8c5f4fa2484aa2346e9b1bd70e7e.s2.eu.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts',
  username: 'hivemq.webclient.1722874200461',
  password: '<aH2#1STL0wJk?sz@h3I'
};

router.post('/', (req, res) => {
  const { locker_id, action, gabeta } = req.body;

  if (!locker_id || !action || !gabeta) {
    return res.status(400).json({ error: true, message: 'Faltan datos necesarios.' });
  }

  const topicBase = `locker/pc${locker_id}/`;
  let topic = '';
  let message = '';
  let responseTopic = '';

  switch (action) {
    case 'sendLocker':
      topic = `${topicBase}sendLocker`;
      message = gabeta;
      responseTopic = `locker/pc${locker_id}/confirm`;
      break;
    case 'receiveLocker':
      topic = `${topicBase}receiveLocker`;
      message = gabeta;
      responseTopic = `locker/pc${locker_id}/confirm`;
      break;
    case 'getWeight':
      topic = `${topicBase}getWeight`;
      message = 'weight';
      responseTopic = `locker/pc${locker_id}/sendWeight`;
      break;
    case 'getMeasure':
      topic = `${topicBase}getMeasure`;
      message = '1';
      responseTopic = `locker/pc${locker_id}/sendMeasure`;
      break;
    case 'checkDoor':
      topic = `${topicBase}checkDoor`;
      message = gabeta;
      responseTopic = `locker/pc${locker_id}/checkDoorResponse`;
      break;
    default:
      return res.status(400).json({ error: true, message: 'Acción no válida.' });
  }

  const client = mqtt.connect(mqttOptions);

  client.on('connect', () => {
    console.log('Conectado al broker MQTT');

    client.publish(topic, message, { qos: 0 }, (err) => {
      if (err) {
        console.error('Error al publicar el mensaje:', err);
        client.end();
        return res.status(500).json({ error: true, message: 'Error al publicar el mensaje.' });
      }

      client.subscribe(responseTopic, { qos: 0 }, (err) => {
        if (err) {
          console.error('Error al suscribirse al topic de respuesta:', err);
          client.end();
          return res.status(500).json({ error: true, message: 'Error al suscribirse al topic de respuesta.' });
        }
      });
    });
  });

  client.on('message', (topic, message) => {
    console.log(`Mensaje recibido en ${topic}: ${message.toString()}`);
    const response = `${topic}: ${message.toString()}`;
    client.end();
    return res.json({ error: false, message: response });
  });

  client.on('error', (err) => {
    console.error('Error de conexión:', err);
    client.end();
    return res.status(500).json({ error: true, message: 'Error de conexión al broker MQTT.' });
  });
});

module.exports = router;