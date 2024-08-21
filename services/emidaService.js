const axios = require('axios');
const xml2js = require('xml2js');
const config = require('../config/config');

class EmidaService {
  constructor() {
    this.baseURL = config.RECARGAS_URL;
    this.credentials = config.RECARGAS_CREDENTIALS;
  }

  async makeSOAPRequest(method, params) {
    const soapEnvelope = this.createSOAPEnvelope(method, params);
    
    console.log('Sending SOAP request to:', this.baseURL);
    console.log('SOAP Envelope:', soapEnvelope);
  
    try {
      const response = await axios.post(this.baseURL, soapEnvelope, {
        headers: { 
          'Content-Type': 'text/xml',
          'SOAPAction': `urn:debisys-soap-services#${method}`
        },
        validateStatus: function (status) {
          return status < 500; // Resolve only if the status code is less than 500
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.status !== 200) {
        console.error('Non-200 status code received:', response.status);
        console.error('Response data:', response.data);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (typeof response.data !== 'string') {
        console.error('Unexpected response type:', typeof response.data);
        console.error('Response data:', response.data);
        throw new Error('Unexpected response type');
      }
  
      return this.parseSOAPResponse(response.data, method);
    } catch (error) {
      console.error('Error making SOAP request:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  createSOAPEnvelope(method, params) {
    let xmlParams = '';
    if (method === 'ProductFlowInfoService') {
      xmlParams = `
        <command xsi:type="xsd:string">ProductFlowInfoService</command>
        <parameters xsi:type="xsd:string">${JSON.stringify(params)}</parameters>
      `;
    } else {
      xmlParams = Object.entries(params)
        .map(([key, value]) => `<${key} xsi:type="xsd:string">${value}</${key}>`)
        .join('');
    }
  
    return `
      <soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:debisys-soap-services">
        <soapenv:Header/>
        <soapenv:Body>
          <urn:${method === 'ProductFlowInfoService' ? 'executeCommand' : method} soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
            ${xmlParams}
          </urn:${method === 'ProductFlowInfoService' ? 'executeCommand' : method}>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
  }

  async parseSOAPResponse(xmlResponse, method) {
    console.log('Raw XML Response:', xmlResponse);
    
    return new Promise((resolve, reject) => {
      xml2js.parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          console.error('XML Parsing Error:', err);
          reject(err);
        } else {
          console.log('Parsed XML:', JSON.stringify(result, null, 2));
          
          if (!result || !result['soapenv:Envelope']) {
            console.error('Unexpected response structure');
            reject(new Error('Unexpected response structure'));
            return;
          }
          
          const responseBody = result['soapenv:Envelope']['soapenv:Body'];
          if (!responseBody) {
            console.error('SOAP Body not found in response');
            reject(new Error('SOAP Body not found in response'));
            return;
          }
          
          let methodResponse;
          if (method === 'ProductFlowInfoService') {
            methodResponse = responseBody['ns1:executeCommandResponse'];
          } else {
            methodResponse = responseBody[`ns1:${method}Response`];
          }
  
          if (methodResponse && methodResponse.return) {
            try {
              // Clean the inner XML string
              let cleanedXml = methodResponse.return._.trim();
              // Remove any leading non-XML characters
              cleanedXml = cleanedXml.substring(cleanedXml.indexOf('<'));
              
              // Parse the cleaned inner XML string
              xml2js.parseString(cleanedXml, { explicitArray: false }, (innerErr, innerResult) => {
                if (innerErr) {
                  console.error('Error parsing inner XML:', innerErr);
                  console.error('Cleaned XML:', cleanedXml);
                  reject(innerErr);
                } else {
                  console.log('Parsed inner XML:', JSON.stringify(innerResult, null, 2));
                  resolve(innerResult);
                }
              });
            } catch (parseError) {
              console.error('Error parsing return value:', parseError);
              reject(parseError);
            }
          } else {
            console.error('Unexpected method response structure');
            reject(new Error('Unexpected method response structure'));
          }
        }
      });
    });
  }

  async getProducts() {
    const params = {
      version: '1',
      terminalId: this.credentials.terminalId,
      invoiceNo: Date.now().toString(),
      language: '1',
      clerkId: this.credentials.clerkId
    };
  
    console.log('GetProducts params:', params);
  
    try {
      const response = await this.makeSOAPRequest('ProductFlowInfoService', params);
      
      console.log('Full response from ProductFlowInfoService:', JSON.stringify(response, null, 2));
  
      if (response && response.ProductFlowInfoServiceResponse && 
          response.ProductFlowInfoServiceResponse.ResponseMessage && 
          response.ProductFlowInfoServiceResponse.ResponseMessage.Products && 
          response.ProductFlowInfoServiceResponse.ResponseMessage.Products.Product) {
        
        const products = response.ProductFlowInfoServiceResponse.ResponseMessage.Products.Product;
        return Array.isArray(products) ? products : [products];
      } else {
        console.error('Unexpected response structure:', response);
        throw new Error('Unexpected product list structure');
      }
    } catch (error) {
      console.error('Error in getProducts:', error);
      if (error.message.includes('Non-whitespace before first tag')) {
        console.error('Raw response causing parsing error:', error.rawResponse);
      }
      throw error;
    }
  }


  async recharge(productId, accountId, amount, invoiceNo) {
    const params = {
      Version: '01',
      SiteId: this.credentials.terminalId,
      ClerkId: this.credentials.clerkId,
      ProductId: productId,
      AccountId: accountId,
      Amount: amount,
      InvoiceNo: invoiceNo,
      LanguageOption: '1'
    };

    return this.makeSOAPRequest('PinDistSale', params);
  }

  async lookupTransaction(invoiceNo) {
    const params = {
      Version: '01',
      TerminalId: this.credentials.terminalId,
      ClerkId: this.credentials.clerkId,
      InvoiceNo: invoiceNo
    };

    return this.makeSOAPRequest('LookupTransactionByInvoiceNo', params);
  }

  async getAccountBalance() {
    const params = {
      version: '01',
      terminalId: this.credentials.terminalId,
      merchantId: this.credentials.merchantId
    };
  
    console.log('GetAccountBalance params:', params);
  
    try {
      const response = await this.makeSOAPRequest('GetAccountBalance', params);
      
      console.log('Full response from GetAccountBalance:', JSON.stringify(response, null, 2));
  
      if (response && response.GetAccountBalanceResponse) {
        return {
          siteId: response.GetAccountBalanceResponse.siteId,
          merchantId: response.GetAccountBalanceResponse.merchantId,
          legalBusinessName: response.GetAccountBalanceResponse.legalBusinessname,
          dba: response.GetAccountBalanceResponse.dba,
          availableBalance: response.GetAccountBalanceResponse.availableBalance
        };
      } else {
        console.error('Unexpected response structure:', response);
        throw new Error('Unexpected account balance response structure');
      }
    } catch (error) {
      console.error('Error in getAccountBalance:', error);
      throw error;
    }
  }

  
}

module.exports = new EmidaService();