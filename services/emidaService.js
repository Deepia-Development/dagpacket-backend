const axios = require('axios');
const xml2js = require('xml2js');
const config = require('../config/config');

class EmidaService {
  constructor() {
    this.recargasURL = config.RECARGAS_URL;
    this.pagoServiciosURL = config.PAGO_SERVICIOS_URL;
    this.recargasCredentials = config.RECARGAS_CREDENTIALS;
    this.pagoServiciosCredentials = config.PAGO_SERVICIOS_CREDENTIALS;
  }

  async makeSOAPRequest(method, params, isPaymentService = false) {
    const url = isPaymentService ? this.pagoServiciosURL : this.recargasURL;
    const credentials = isPaymentService ? this.pagoServiciosCredentials : this.recargasCredentials;
    const soapEnvelope = this.createSOAPEnvelope(method, params);
    
    try {
      const response = await axios.post(url, soapEnvelope, {
        headers: { 
          'Content-Type': 'text/xml',
          'SOAPAction': `urn:debisys-soap-services#${method}`
        },
        validateStatus: function (status) {
          return status < 500;
        }
      });      
  
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (typeof response.data !== 'string') {
        throw new Error('Unexpected response type');
      }
  
      return this.parseSOAPResponse(response.data, method);
  
    } catch (error) {
      console.error('Error making SOAP request:', error.message);
  
      return {
        error: 'SOAP request failed',
        message: error.message,
        responseCode: error.response?.status || 'Unknown'
      };
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
  
          const responseBody = result['soapenv:Envelope']?.['soapenv:Body'];
          if (!responseBody) {
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
            let cleanedXml = methodResponse.return._.trim();
  
            xml2js.parseString(cleanedXml, { explicitArray: false }, (innerErr, innerResult) => {
              if (innerErr) {
                console.error('Error parsing inner XML:', innerErr);
                reject(innerErr);
              } else {
                console.log('Parsed inner XML:', JSON.stringify(innerResult, null, 2));
                resolve(innerResult);
              }
            });
          } else {
            reject(new Error('Unexpected method response structure'));
          }
        }
      });
    });
  }

  async getProducts(isPaymentService = false) {
    const credentials = isPaymentService ? this.pagoServiciosCredentials : this.recargasCredentials;
    const params = {
      version: '1',
      terminalId: credentials.terminalId,
      invoiceNo: Date.now().toString(),
      language: '1',
      clerkId: credentials.clerkId
    };
  
    try {
      const response = await this.makeSOAPRequest('ProductFlowInfoService', params, isPaymentService);            
  
      if (response && response.ProductFlowInfoServiceResponse && 
          response.ProductFlowInfoServiceResponse.ResponseMessage && 
          response.ProductFlowInfoServiceResponse.ResponseMessage.Products && 
          response.ProductFlowInfoServiceResponse.ResponseMessage.Products.Product) {
        
        const products = response.ProductFlowInfoServiceResponse.ResponseMessage.Products.Product;
        return Array.isArray(products) ? products : [products];
      } else {
        throw new Error('Unexpected product list structure');
      }
    } catch (error) {
      throw error;
    }
  }

  async getPaymentServices() {
    return this.getProducts(true);
  }

  // Simulación de códigos de error
  async recharge(productId, accountId, amount, invoiceNo) {
    // Simulación del código 16 para proveedor no disponible
    if (productId === 'PROVEEDOR_NO_DISPONIBLE') {
      return {
        responseCode: '16',
        message: 'Provider Error'
      };
    }

    // Simulación del código 18 para XML not activated
    if (productId === 'XML_NOT_ACTIVATED') {
      return {
        responseCode: '18',
        message: 'XML NOT ACTIVATED'
      };
    }

    return this.performTransaction('recharge', productId, { reference1: accountId }, amount, invoiceNo);
  }

  async billPayment(productId, references, amount, invoiceNo) {
    return this.performTransaction('billPayment', productId, references, amount, invoiceNo);
  }

  async performTransaction(transactionType, productId, references, amount, invoiceNo) {
    let method;
    let params;
    let isPaymentService = false;

    const product = await this.getProductDetails(productId);

    switch (transactionType) {
      case 'billPayment':
        method = 'BillPaymentUserFee';
        isPaymentService = true;
        params = {
          Version: '01',
          TerminalId: this.pagoServiciosCredentials.terminalId,
          ClerkId: this.pagoServiciosCredentials.clerkId,
          ProductId: productId,
          Amount: amount,
          AccountId: this.constructAccountId(product, references),
          InvoiceNo: invoiceNo,
          LanguageOption: '1'
        };
        break;
      case 'recharge':
        method = 'PinDistSale';
        params = {
          Version: '01',
          SiteId: this.recargasCredentials.terminalId,
          ClerkId: this.recargasCredentials.clerkId,
          ProductId: productId,
          AccountId: references.reference1,
          Amount: amount,
          InvoiceNo: invoiceNo,
          LanguageOption: '1'
        };
        break;
      default:
        throw new Error(`Unsupported transaction type: ${transactionType}`);
    }

    return this.makeSOAPRequest(method, params, isPaymentService);
  }

  async getProductDetails(productId) {
    const products = await this.getPaymentServices();
    return products.find(p => p.ProductId === productId);
  }

  constructAccountId(product, references) {
    let accountId = '';
    if (product.ReferenceParameters.Reference1) {
      accountId += references.reference1 || '';
    }
    if (product.ReferenceParameters.Reference2) {
      if (Array.isArray(product.ReferenceParameters.Reference2)) {
        const ref2 = product.ReferenceParameters.Reference2.find(r => 
          references.reference2 && 
          references.reference2.length >= r.LengthMin && 
          references.reference2.length <= r.LengthMax
        );
        if (ref2) {
          accountId += ref2.Prefix + references.reference2;
        }
      } else {
        accountId += product.ReferenceParameters.Reference2.Prefix + (references.reference2 || '');
      }
    }
    return accountId;
  }

  async lookupTransaction(invoiceNo, isPaymentService = false) {
    const credentials = isPaymentService ? this.pagoServiciosCredentials : this.recargasCredentials;
    const params = {
      Version: '01',
      TerminalId: credentials.terminalId,
      ClerkId: credentials.clerkId,
      InvoiceNo: invoiceNo
    };

    return this.makeSOAPRequest('LookupTransactionByInvoiceNo', params, isPaymentService);
  }

  async getAccountBalance(isPaymentService = false) {
    const credentials = isPaymentService ? this.pagoServiciosCredentials : this.recargasCredentials;
    const params = {
      version: '01',
      terminalId: credentials.terminalId,
      merchantId: credentials.merchantId
    };      
  
    try {
      const response = await this.makeSOAPRequest('GetAccountBalance', params, isPaymentService);            
  
      if (response && response.GetAccountBalanceResponse) {
        return {
          siteId: response.GetAccountBalanceResponse.siteId,
          merchantId: response.GetAccountBalanceResponse.merchantId,
          legalBusinessName: response.GetAccountBalanceResponse.legalBusinessname,
          dba: response.GetAccountBalanceResponse.dba,
          availableBalance: response.GetAccountBalanceResponse.availableBalance
        };
      } else {
        throw new Error('Unexpected account balance response structure');
      }
    } catch (error) {
      console.error('Error in getAccountBalance:', error);
      throw error;
    }
  }
}

module.exports = new EmidaService();

