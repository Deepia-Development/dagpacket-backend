async function successResponse(message) {
    return {
      success: true,
      message: message         
    };
  }
  
  async function errorResponse(message) {
    return {
      success: false,
      message: message      
    };
  }

  async function dataResponse(message, data){
    return {
        success: true,
        message: message,
        data: data
    }
  }
  

  module.exports = {successResponse , errorResponse, dataResponse }