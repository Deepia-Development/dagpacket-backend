const MqttService = require("../services/mqttService");

class MqttController {
  constructor() {
    this.mqttService = new MqttService();
  }

  async handleRequest(req, res) {
    const { locker_id, action, gabeta } = req.body;

    const topicBase = `locker/pc${locker_id}/`;
    let topic = "";
    let message = "";
    let responseTopic = "";

    switch (action) {
      case "sendLocker":
        topic = topicBase + "sendLocker";
        message = gabeta;
        responseTopic = `locker/pc${locker_id}/confirm`;
        break;
      case "receiveLocker":
        topic = topicBase + "receiveLocker";
        message = gabeta;
        responseTopic = `locker/pc${locker_id}/confirm`;
        break;
      case "getWeight":
        topic = topicBase + "getWeight";
        message = "weight";
        responseTopic = `locker/pc${locker_id}/sendWeight`;
        break;
      case "getMeasure":
        topic = topicBase + "getMeasure";
        message = "1";
        responseTopic = `locker/pc${locker_id}/sendMeasure`;
        break;
      case "checkDoor":
        topic = topicBase + "checkDoor";
        message = gabeta;
        responseTopic = `locker/pc${locker_id}/checkDoorResponse`;
        break;
      default:
        res.status(400).json({ error: true, message: "Acción no válida" });
        return;
    }

    try {
      await this.mqttService.connect();
      await this.mqttService.publish(topic, message);

      const response = await new Promise((resolve) => {
        const onMessage = (receivedTopic, receivedMessage) => {
          if (receivedTopic === responseTopic) {
            resolve(receivedMessage);
          }
        };

        this.mqttService.subscribe(responseTopic, onMessage);

        setTimeout(() => {
          resolve(null);
        }, 3000);
      });

      if (response) {
        res.json({ error: false, message: response });
      } else {
        res
          .status(408)
          .json({
            error: true,
            message: "No se recibió respuesta del broker MQTT",
          });
      }

      await this.mqttService.close();
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ error: true, message: "Error al procesar la solicitud" });
    }
  }
}



module.exports = {
  MqttController,
};
