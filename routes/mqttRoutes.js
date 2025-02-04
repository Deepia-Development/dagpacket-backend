const express = require('express');
const mqtt = require('mqtt');
require('dotenv').config();

const router = express.Router();

// Map para rastrear peticiones activas
// La clave será: `${locker_id}-${action}-${gabeta}`
const activeRequests = new Map();

const mqttOptions = {
  host: process.env.MQTT_SERVER,
  port: 8883,
  protocol: 'mqtts',
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
};

router.post('/', (req, res) => {
  const { locker_id, action, gabeta } = req.body;
  
  if (!locker_id || !action || !gabeta) {
    return res.status(400).json({ error: true, message: 'Faltan datos necesarios.' });
  }

  // Crear una clave única para esta petición
  const requestKey = `${locker_id}-${action}-${gabeta}`;

  // Verificar si ya existe una petición activa para esta combinación
  if (activeRequests.has(requestKey)) {
    return res.status(409).json({ 
      error: true, 
      message: 'Ya existe una petición activa para este locker y acción.' 
    });
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

  // Registrar la petición como activa
  activeRequests.set(requestKey, true);

  const client = mqtt.connect(mqttOptions);
  let timeoutId;

  // Función de limpieza
  const cleanup = () => {
    clearTimeout(timeoutId);
    client.end();
    activeRequests.delete(requestKey); // Eliminar la petición del registro
  };

  client.on('connect', () => {
    console.log('Conectado al broker MQTT');

    client.publish(topic, message, { qos: 0 }, (err) => {
      if (err) {
        console.error('Error al publicar el mensaje:', err);
        cleanup();
        return res.status(500).json({ error: true, message: 'Error al publicar el mensaje.' });
      }

      client.subscribe(responseTopic, { qos: 0 }, (err) => {
        if (err) {
          console.error('Error al suscribirse al topic de respuesta:', err);
          cleanup();
          return res.status(500).json({ error: true, message: 'Error al suscribirse al topic de respuesta.' });
        }
      });

      timeoutId = setTimeout(() => {
        cleanup();
        return res.status(500).json({ error: true, message: 'Tiempo de espera agotado.' });
      }, 15000);
    });
  });

  client.on('message', (topic, message) => {
    console.log(`Mensaje recibido en ${topic}: ${message.toString()}`);
    const response = `${topic}: ${message.toString()}`;
    cleanup();
    res.json({ error: false, message: response });
  });

  client.on('error', (err) => {
    console.error('Error de conexión:', err);
    cleanup();
    return res.status(500).json({ error: true, message: 'Error de conexión al broker MQTT.' });
  });

  // Manejar el cierre de la conexión HTTP
  res.on('close', () => {
    cleanup();
  });
});

// Opcionalmente, puedes agregar una ruta para limpiar manualmente las peticiones bloqueadas
router.post('/clear-locks', (req, res) => {
  const { locker_id, action, gabeta } = req.body;
  
  if (!locker_id || !action || !gabeta) {
    return res.status(400).json({ error: true, message: 'Faltan datos necesarios.' });
  }

  const requestKey = `${locker_id}-${action}-${gabeta}`;
  activeRequests.delete(requestKey);
  
  res.json({ message: 'Lock cleared successfully' });
});

module.exports = router;