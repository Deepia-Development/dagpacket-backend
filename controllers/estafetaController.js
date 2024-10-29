const EstafetaService = require("../services/estafetaService");
const { mapEstafetaResponse } = require("../utils/estafetaMaper");



exports.getQuote = async (req, res) => {
  try{
    const inputData = {
        pais_origen: req.body.pais_origen,
        pais_destino: req.body.pais_destino,
        cp_origen: req.body.cp_origen,
        cp_destino: req.body.cp_destino,
        alto: req.body.alto,
        ancho: req.body.ancho,
        largo: req.body.largo,
        peso: req.body.peso,
        seguro: req.body.seguro,
        valor_declarado: req.body.valor_declarado
      };

      const estafetaResponse = await EstafetaService.getQuote(inputData);


        const mappedResponse = mapEstafetaResponse(estafetaResponse, inputData);

        res.json({ paqueterias: mappedResponse });
  }catch(error){
    console.error('Error en estafetaController:', error);
    res.status(500).json({
      error: 'Error al obtener cotización de Estafeta',
      details: error.response ? error.response.data : error.message
    });
  }
}
