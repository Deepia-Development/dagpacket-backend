const axios = require("axios");
const xml2js = require("xml2js");
const config = require("../config/config");
const InvoiceNo = require("../models/recharguesInvoice");
const EmidaModel = require('../models/EmidaModel');
const Transaction = require("../models/TransactionsModel");
const mongoose = require("mongoose");
const { stat } = require("fs-extra");
const UsersModel = require("../models/UsersModel");
const WalletsModel = require("../models/WalletsModel");
const CashTransactionModel = require("../models/CashTransactionModel");
const CashRegisterModel = require("../models/CashRegisterModel");

const DEFAULT_TIMEOUT = {
  INITIAL_TIMEOUT: 35000, // 35 seconds initial timeout
  RETRY_INTERVAL: 10000, // 10 seconds between retries
  MAX_RETRIES: 4, // Maximum 4 retries as shown in diagram
  TOTAL_TIMEOUT: 90000, // 90 seconds total timeout
};

class EmidaService {
  constructor() {
    this.recargasURL = config.RECARGAS_URL;
    this.pagoServiciosURL = config.PAGO_SERVICIOS_URL;
    this.recargasCredentials = config.RECARGAS_CREDENTIALS;
    this.pagoServiciosCredentials = config.PAGO_SERVICIOS_CREDENTIALS;
  }

  async makeSOAPRequest(method, params, isPaymentService = false) {
    const url = isPaymentService ? this.pagoServiciosURL : this.recargasURL;
    // console.log("Making SOAP request to:", url);
    // console.log("Method:", method);
    // console.log("Params:", params);
    // console.log("Is Payment Service:", isPaymentService);
    const credentials = isPaymentService
      ? this.pagoServiciosCredentials
      : this.recargasCredentials;
    const soapEnvelope = this.createSOAPEnvelope(method, params);

    try {
      const response = await axios.post(url, soapEnvelope, {
        headers: {
          "Content-Type": "text/xml",
          SOAPAction: `urn:debisys-soap-services#${method}`,
        },
        validateStatus: function (status) {
          return status < 500;
        },
      });

      if (response.status !== 200) {
        console.log("HTTP error:", response);
        console.error("HTTP error:", response);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (typeof response.data !== "string") {
        throw new Error("Unexpected response type");
      }

      return this.parseSOAPResponse(response.data, method);
    } catch (error) {
      console.error("Error making SOAP request:", error.message);

      return {
        error: "SOAP request failed",
        message: error.message,
        responseCode: error.response?.status || "Unknown",
      };
    }
  }

  createSOAPEnvelope(method, params) {
    let xmlParams = "";
    if (method === "ProductFlowInfoService") {
      xmlParams = `
        <command xsi:type="xsd:string">ProductFlowInfoService</command>
        <parameters xsi:type="xsd:string">${JSON.stringify(params)}</parameters>
      `;
    } else {
      xmlParams = Object.entries(params)
        .map(
          ([key, value]) => `<${key} xsi:type="xsd:string">${value}</${key}>`
        )
        .join("");
    }

    return `
      <soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:debisys-soap-services">
        <soapenv:Header/>
        <soapenv:Body>
          <urn:${
            method === "ProductFlowInfoService" ? "executeCommand" : method
          } soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
            ${xmlParams}
          </urn:${
            method === "ProductFlowInfoService" ? "executeCommand" : method
          }>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
  }

  async parseSOAPResponse(xmlResponse, method) {
    console.log("Raw XML Response:", xmlResponse);

    return new Promise((resolve, reject) => {
      xml2js.parseString(
        xmlResponse,
        { explicitArray: false },
        (err, result) => {
          if (err) {
            console.error("XML Parsing Error:", err);
            reject(err);
          } else {
            console.log("Parsed XML:", JSON.stringify(result, null, 2));

            const responseBody = result["soapenv:Envelope"]?.["soapenv:Body"];
            if (!responseBody) {
              reject(new Error("SOAP Body not found in response"));
              return;
            }

            let methodResponse;
            if (method === "ProductFlowInfoService") {
              methodResponse = responseBody["ns1:executeCommandResponse"];
            } else {
              methodResponse = responseBody[`ns1:${method}Response`];
            }

            if (methodResponse && methodResponse.return) {
              let cleanedXml = methodResponse.return._.trim();

              xml2js.parseString(
                cleanedXml,
                { explicitArray: false },
                (innerErr, innerResult) => {
                  if (innerErr) {
                    console.error("Error parsing inner XML:", innerErr);
                    reject(innerErr);
                  } else {
                    console.log(
                      "Parsed inner XML:",
                      JSON.stringify(innerResult, null, 2)
                    );
                    resolve(innerResult);
                  }
                }
              );
            } else {
              reject(new Error("Unexpected method response structure"));
            }
          }
        }
      );
    });
  }

  async getProducts(isPaymentService = false) {
    const credentials = isPaymentService
      ? this.pagoServiciosCredentials
      : this.recargasCredentials;
    const params = {
      version: "1",
      terminalId: credentials.terminalId,
      invoiceNo: Date.now().toString(),
      language: "1",
      clerkId: credentials.clerkId,
    };

    try {
      const response = await this.makeSOAPRequest(
        "ProductFlowInfoService",
        params,
        isPaymentService
      );

      if (
        response &&
        response.ProductFlowInfoServiceResponse &&
        response.ProductFlowInfoServiceResponse.ResponseMessage &&
        response.ProductFlowInfoServiceResponse.ResponseMessage.Products &&
        response.ProductFlowInfoServiceResponse.ResponseMessage.Products.Product
      ) {
        const products =
          response.ProductFlowInfoServiceResponse.ResponseMessage.Products
            .Product;
        return Array.isArray(products) ? products : [products];
      } else {
        throw new Error("Unexpected product list structure");
      }
    } catch (error) {
      throw error;
    }
  }

  async getPaymentServices() {
    return this.getProducts(true);
  }

  // Simulación de códigos de error
  // async recharge(productId, accountId, amount, invoiceNo) {
  //   // Simulación del código 16 para proveedor no disponible
  //   if (productId === "PROVEEDOR_NO_DISPONIBLE") {
  //     return {
  //       responseCode: "16",
  //       message: "Provider Error",
  //     };
  //   }

  //   // Simulación del código 18 para XML not activated
  //   if (productId === "XML_NOT_ACTIVATED") {
  //     return {
  //       responseCode: "18",
  //       message: "XML NOT ACTIVATED",
  //     };
  //   }

  //   return this.performTransaction(
  //     "recharge",
  //     productId,
  //     { reference1: accountId },
  //     amount,
  //     invoiceNo
  //   );
  // }

  async recharge(productId, accountId, amount, invoiceNo, id, paymentMethod,productName) {
    // Simulación del código 16 para proveedor no disponible
    if (productId === "PROVEEDOR_NO_DISPONIBLE") {
      return {
        responseCode: "16",
        message: "Provider Error",
      };
    }

    // Simulación del código 18 para XML not activated
    if (productId === "XML_NOT_ACTIVATED") {
      return {
        responseCode: "18",
        message: "XML NOT ACTIVATED",
      };
    }

    return this.performTransactionWithLookup(
      "recharge",
      productId,
      { reference1: accountId },
      amount,
      invoiceNo,
      id,
      paymentMethod,
      productName
    );
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async billPayment(
    productId,
    references,
    amount,
    invoiceNo,
    id,
    paymentMethod,
    productName
  ) {
    console.log("ProductName: ", productName);
    return this.performTransactionWithLookup2(
      "billPayment",
      productId,
      references,
      amount,
      invoiceNo,
      id,
      paymentMethod,
      productName
    );
  }

  async performTransactionWithLookup2(
    transactionType,
    productId,
    references,
    amount,
    id,
    paymentMethod,
    productName
  ) {
    const InvoiceNoData = await InvoiceNo.find();

    let newInvoiceNumber;
console.log("ProproductName: ", productName);
    console.log("Transaction Type: ", transactionType);
    console.log("Product ID: ", productId);
    console.log("References: ", references);
    console.log("Amount: ", amount);
    console.log("ID: ", id);
    console.log("Payment Method: ", paymentMethod);

    if (InvoiceNoData.length === 0) {
      newInvoiceNumber = 1;
    } else {
      const lastInvoice = InvoiceNoData[InvoiceNoData.length - 1];
      // Asegúrate de que `invoiceNo` es un número
      const lastInvoiceNumber = parseInt(lastInvoice.invoiceNo, 10) || 0;
      newInvoiceNumber = lastInvoiceNumber + 1;

      console.log("Last Invoice Number: ", lastInvoiceNumber);
      console.log("New Invoice Number: ", newInvoiceNumber);
    }

    const newInvoice = new InvoiceNo({ invoiceNo: newInvoiceNumber });
    await newInvoice.save();

    console.log("Invoice Number: ", newInvoiceNumber);

    let invoiceNo = newInvoiceNumber;

    const INITIAL_TIMEOUT = 60000; // 40 segundos
    var starTime;
    // Crear una promesa que se resuelva con el resultado de performTransaction
    // o se rechace después de 40 segundos

    const transactionType2 = "transactionType";
    const transactionPromise = new Promise(async (resolve, reject) => {
      try {
        starTime = Date.now();
        const result = await this.performTransaction(
          transactionType2,
          productId,
          references,
          amount,
          invoiceNo
        );

        // console.log("Transaction Result:", result);

        if (result.BillPaymentUserFeeResponse.ResponseCode === "00") {
          await createTransaction(id, paymentMethod, amount, productName,result);
          console.log("Transaction Success");
        } else {
          console.log("Transaction Failed");
        }

        resolve(result);
      } catch (error) {
        console.error("Error in transactionPromise:", error);
        reject(error);
      }
    });

    const createTransaction = async (id, paymentMethod, amount,productName,result) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      // console.log("Session: ", session);
      console.log("Result: ", result);
      console.log("Product Name: ", productName);
      try {
        const EmidaComission = await EmidaModel.find().session(session);
        const emidaComissionValue = EmidaComission[0].comission;
        const userId = id;
        console.log("User ID: ", userId);
        let user = await UsersModel.findById(userId).session(session);

        if (!user) {
          throw new Error("User not found");
        }

        let actualUser = userId;
        let utilityPercentage;

        if (user.role === "CAJERO" && user.parentUser) {
          actualUser = user.parentUser;
          user = await UsersModel.findById(actualUser).session(session);
          if (!user) {
            throw new Error("User not found");
          }
        }

        utilityPercentage = user.recharguesPercentage
          ? parseFloat(user.recharguesPercentage.toString()) / 100
          : 0;

        const wallet = await WalletsModel.findOne({ user: actualUser }).session(
          session
        );

        if (!wallet) {
          throw new Error("Wallet not found");
        }

        console.log("Wallet: ", wallet);

        console.log("Amount: ", amount);

        let totalPrice = 0;
        console.log("Total Price: ", totalPrice);

        if (paymentMethod === "saldo") {
          totalPrice = amount;
          const sendBalance = parseFloat(wallet.rechargeBalance.toString());
          if (sendBalance < totalPrice) {
            throw new Error("Insufficient balance");
          }

          wallet.rechargeBalance = sendBalance - totalPrice;
          await wallet.save();
        }

        const previous_balance =
          parseFloat(wallet.rechargeBalance.toString()) +
          parseFloat(totalPrice);
        console.log("Previous Balance: ", previous_balance);
        console.log("Total Price: ", parseFloat(totalPrice).toFixed(2));
        console.log("Amount: ", amount);

        const transaction = new Transaction({
          user_id: actualUser,
          licensee_id:
            user.role === "LICENCIATARIO_TRADICIONAL"
              ? user._id
              : user.licensee_id,
          service: "Pago de servicio",
          emida_details: productName,
          reference_number: result?.BillPaymentUserFeeResponse?.Pin || result?.PinDistSaleResponse?.PIN || 'N/A',
          emida_code: result?.BillPaymentUserFeeResponse?.ControlNo || result?.PinDistSaleResponse?.ControlNo  || 'N/A',
          transaction_number: `${Date.now()}`,
          payment_method: paymentMethod,
          previous_balance: previous_balance.toFixed(2),
          amount: parseFloat(totalPrice).toFixed(2),
          new_balance: (previous_balance - totalPrice).toFixed(2),
          dagpacket_commission: parseFloat(emidaComissionValue.toString()),
          details: "Pago de servicio",
          status: "Pagado",
        });

        await transaction.save({ session });
        let currentCashRegister = await CashRegisterModel.findOne({
          licensee_id: user.role === "CAJERO" ? user.parentUser : actualUser,
          status: "open",
        }).session(session);

        if (currentCashRegister) {
          // Registrar la transacción en la caja
          const cashTransaction = new CashTransactionModel({
            cash_register_id: currentCashRegister._id,
            transaction_id: transaction._id,
            licensee_id: user.role === "CAJERO" ? user.parentUser : actualUser,
            employee_id: user.role === "CAJERO" ? userId : undefined,
            operation_by: userId,
            payment_method: paymentMethod,
            amount: totalPrice,
            dagpacket_commission: parseFloat(emidaComissionValue.toString()),

            type: "ingreso",
            description: `Pago de servicio`,
          });
          await cashTransaction.save({ session });

          currentCashRegister.total_sales += totalPrice;
          await currentCashRegister.save({ session });
        }

        await session.commitTransaction();
      } catch (error) {
        console.error("Error in createTransaction:", error);
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    };

    // Crear el timeout de 40 segundos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Transaction timeout")),
        INITIAL_TIMEOUT
      );
    });

    try {
      // Esperar la primera respuesta entre la transacción o el timeout
      const transactionResult = await Promise.race([
        transactionPromise,
        timeoutPromise,
      ]);

      if (transactionResult.error) {
        return transactionResult;
      }

      return transactionResult;
    } catch (error) {
      // Si hay timeout o error, procedemos con los 4 intentos de lookup
      console.log(`El tiempo transcurrido es de: ${Date.now() - starTime} ms`);
      console.log(
        "Initial transaction timed out, proceeding with lookup retries"
      );

      for (let attempt = 1; attempt <= 4; attempt++) {
        console.log(
          `El tiempo transcurrido es de: ${
            Date.now() - starTime
          } ms iniciando lookup número ${attempt}`
        );

        let lookupResult = await this.lookupTransaction(invoiceNo, true);
        const result = lookupResult;
        const response = result.PinDistSaleResponse;
        console.log("Response:", response);

        console.log("Response: ", response);

        if (
          response &&
          (response.ResponseCode === "00" || response.ResponseCode === "51")
        ) {
          if (response.ResponseCode === "00") {
            await createTransaction(id, paymentMethod, amount,productName,result);
            console.log("Transaction Success");
          }
          console.log(`Transaction found in lookup número ${attempt}`);
          console.log(
            `El tiempo transcurrido es de: ${Date.now() - starTime} ms`
          );
          console.log(lookupResult);
          return lookupResult;
        } else {
          console.log(`Transaction not found in lookup número ${attempt}`);
        }

        if (attempt < 4) {
          console.log(`Esperando 10 segundos antes de intentar nuevamente...`);
          await this.sleep(10000); // Espera 10 segundos antes del próximo intento
        }
      }

      console.log(
        "Final lookup: No se encontró la transacción después de 4 intentos."
      );
      return null; // Manejo en caso de no encontrar resultados en los intentos
    }
    Ï;
  }

  async performTransactionWithLookup(
    transactionType,
    productId,
    references,
    amount,
    id,
    paymentMethod,
    productName
  ) {
    const InvoiceNoData = await InvoiceNo.find();

    let newInvoiceNumber;

    if (InvoiceNoData.length === 0) {
      newInvoiceNumber = 1;
    } else {
      const lastInvoice = InvoiceNoData[InvoiceNoData.length - 1];
      // Asegúrate de que `invoiceNo` es un número
      const lastInvoiceNumber = parseInt(lastInvoice.invoiceNo, 10) || 0;
      newInvoiceNumber = lastInvoiceNumber + 1;

      console.log("Last Invoice Number: ", lastInvoiceNumber);
      console.log("New Invoice Number: ", newInvoiceNumber);
    }

    const newInvoice = new InvoiceNo({ invoiceNo: newInvoiceNumber });
    await newInvoice.save();

    console.log("Invoice Number: ", newInvoiceNumber);

    let invoiceNo = newInvoiceNumber;

    const INITIAL_TIMEOUT = 40000; // 40 segundos
    var starTime;
    // Crear una promesa que se resuelva con el resultado de performTransaction
    // o se rechace después de 40 segundos

    const transactionPromise = new Promise(async (resolve, reject) => {
      try {
        starTime = Date.now();
        const result = await this.performTransaction(
          transactionType,
          productId,
          references,
          amount,
          invoiceNo
        );

        // console.log("Transaction Result:", result);

        if (result.PinDistSaleResponse.ResponseCode === "00") {
          await createTransaction(id, paymentMethod, amount,productName,result);
          console.log("Transaction Success");
        } else {
          console.log("Transaction Failed");
        }

        resolve(result);
      } catch (error) {
        console.error("Error in transactionPromise:", error);
        reject(error);
      }
    });

    const createTransaction = async (id, paymentMethod, amount,productName,result) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      console.log("Session: ", session);

      try {
     
        const userId = id;
        console.log("User ID: ", userId);
        let user = await UsersModel.findById(userId).session(session);

        if (!user) {
          throw new Error("User not found");
        }

        let actualUser = userId;
        let utilityPercentage;

        if (user.role === "CAJERO" && user.parentUser) {
          actualUser = user.parentUser;
          user = await UsersModel.findById(actualUser).session(session);
          if (!user) {
            throw new Error("User not found");
          }
        }

        utilityPercentage = user.recharguesPercentage
          ? parseFloat(user.recharguesPercentage.toString()) / 100
          : 0;

        const wallet = await WalletsModel.findOne({ user: actualUser }).session(
          session
        );

        if (!wallet) {
          throw new Error("Wallet not found");
        }

        console.log("Wallet: ", wallet);

        console.log("Amount: ", amount);

        let totalPrice = 0;
        console.log("Total Price: ", totalPrice);

        if (paymentMethod === "saldo") {
          totalPrice = amount;
          const sendBalance = parseFloat(wallet.rechargeBalance.toString());
          if (sendBalance < totalPrice) {
            throw new Error("Insufficient balance");
          }

          wallet.rechargeBalance = sendBalance - totalPrice;
          await wallet.save();
        }

        const previous_balance =
          parseFloat(wallet.rechargeBalance.toString()) +
          parseFloat(totalPrice);
        console.log("Previous Balance: ", previous_balance);
        console.log("Total Price: ", parseFloat(totalPrice).toFixed(2));
        console.log("Amount: ", amount);

        const transaction = new Transaction({
          user_id: actualUser,
          licensee_id:
            user.role === "LICENCIATARIO_TRADICIONAL"
              ? user._id
              : user.licensee_id,
          service: "Recarga telefonica",
          emida_details: productName,
          reference_number:result?.PinDistSaleResponse?.PIN || 'N/A',
          emida_code:result?.PinDistSaleResponse?.ControlNo  || 'N/A',
          transaction_number: `${Date.now()}`,
          payment_method: paymentMethod,
          previous_balance: previous_balance.toFixed(2),
          amount: parseFloat(totalPrice).toFixed(2),
          new_balance: (previous_balance - totalPrice).toFixed(2),
          dagpacket_commission: 0,
          details: "Pago de recarga telefonica",
          status: "Pagado",
        });

        await transaction.save({ session });
        let currentCashRegister = await CashRegisterModel.findOne({
          licensee_id: user.role === "CAJERO" ? user.parentUser : actualUser,
          status: "open",
        }).session(session);

        if (currentCashRegister) {
          // Registrar la transacción en la caja
          const cashTransaction = new CashTransactionModel({
            cash_register_id: currentCashRegister._id,
            transaction_id: transaction._id,
            licensee_id: user.role === "CAJERO" ? user.parentUser : actualUser,
            employee_id: user.role === "CAJERO" ? userId : undefined,
            operation_by: userId,
            payment_method: paymentMethod,
            amount: totalPrice,
            dagpacket_commission: 0,
            type: "ingreso",
            description: `Pago de recarga telefonica`,
          });
          await cashTransaction.save({ session });

          // Actualizar el total de ventas de la caja
          currentCashRegister.total_sales += totalPrice;
          await currentCashRegister.save({ session });
        }

        await session.commitTransaction();
      } catch (error) {
        console.error("Error in createTransaction:", error);
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    };

    // Crear el timeout de 40 segundos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Transaction timeout")),
        INITIAL_TIMEOUT
      );
    });

    try {
      // Esperar la primera respuesta entre la transacción o el timeout
      const transactionResult = await Promise.race([
        transactionPromise,
        timeoutPromise,
      ]);

      if (transactionResult.error) {
        return transactionResult;
      }

      return transactionResult;
    } catch (error) {
      // Si hay timeout o error, procedemos con los 3 intentos de lookup

        console.log('ProductName: ', productName);
      console.log(`El tiempo transcurrido es de: ${Date.now() - starTime} ms`);
      console.log(
        "Initial transaction timed out, proceeding with lookup retries"
      );

      // Primera búsqueda (40-50 segundos)
      console.log(
        `El tiempo transcurrido es de: ${
          Date.now() - starTime
        } ms iniciando primer lookup`
      );

      let lookupResult = await this.lookupTransaction(invoiceNo);
      if (
        lookupResult.PinDistSaleResponse &&
        (lookupResult.PinDistSaleResponse.ResponseCode === "00" ||
          lookupResult.PinDistSaleResponse.ResponseCode === "51")
      ) {
        if (lookupResult.PinDistSaleResponse.ResponseCode === "00") {
          await createTransaction(id, paymentMethod, amount,productName,lookupResult);
          console.log("Transaction Success");
        }
        console.log("Transaction found in first lookup");
        console.log(lookupResult);
        return lookupResult;
      } else {
        console.log("Transaction not found in first lookup");
      }

      // Segunda búsqueda (50-60 segundos)
      await this.sleep(10000);
      console.log(
        `El tiempo transcurrido es de: ${
          Date.now() - starTime
        } ms iniciando segundo lookup`
      );

      lookupResult = await this.lookupTransaction(invoiceNo);
      if (
        lookupResult.PinDistSaleResponse &&
        (lookupResult.PinDistSaleResponse.ResponseCode === "00" ||
          lookupResult.PinDistSaleResponse.ResponseCode === "51")
      ) {
        if (lookupResult.PinDistSaleResponse.ResponseCode === "00") {
          await createTransaction(id, paymentMethod, amount,productName,lookupResult);
          console.log("Transaction Success");
        }

        console.log("Transaction found in second lookup");
        console.log(
          `El tiempo transcurrido es de: ${Date.now() - starTime} ms`
        );
        console.log(lookupResult);
        return lookupResult;
      } else {
        console.log("Transaction not found in second lookup");
      }

      // Tercera búsqueda (70 segundos)
      await this.sleep(10000);
      console.log(
        `El tiempo transcurrido es de: ${
          Date.now() - starTime
        } ms iniciando tercer lookup`
      );

      lookupResult = await this.lookupTransaction(invoiceNo);
      if (
        lookupResult.PinDistSaleResponse &&
        (lookupResult.PinDistSaleResponse.ResponseCode === "00" ||
          lookupResult.PinDistSaleResponse.ResponseCode === "51")
      ) {
        if (lookupResult.PinDistSaleResponse.ResponseCode === "00") {
          await createTransaction(id, paymentMethod, amount,productName,lookupResult);
          console.log("Transaction Success");
        }
        console.log("Transaction found in third lookup");
        console.log(
          `El tiempo transcurrido es de: ${Date.now() - starTime} ms`
        );
        console.log(lookupResult);
        return lookupResult;
      } else {
        console.log("Transaction not found in third lookup");
      }
      await this.sleep(10000);
      console.log(
        `El tiempo transcurrido es de: ${
          Date.now() - starTime
        } ms iniciando tercer lookup`
      );

      lookupResult = await this.lookupTransaction(invoiceNo);
      if (
        lookupResult.PinDistSaleResponse &&
        (lookupResult.PinDistSaleResponse.ResponseCode === "00" ||
          lookupResult.PinDistSaleResponse.ResponseCode === "51")
      ) {
        if (lookupResult.PinDistSaleResponse.ResponseCode === "00") {
          await createTransaction(id, paymentMethod, amount,productName,result);
          console.log("Transaction Success");
        }

        console.log("Transaction found in cuarto lookup");
        console.log(
          `El tiempo transcurrido es de: ${Date.now() - starTime} ms`
        );
        console.log(lookupResult);
        return lookupResult;
      } else if (
        lookupResult.PinDistSaleResponse &&
        lookupResult.PinDistSaleResponse.ResponseCode === "32"
      ) {
        console.log("Transaction found in cuarto lookup");
        console.log(
          `El tiempo transcurrido es de: ${Date.now() - starTime} ms`
        );
        console.log(lookupResult);
        return lookupResult;
      } else {
        console.log("Transaction not found in cuarto lookup");
        console.log(
          `El tiempo transcurrido es de: ${Date.now() - starTime} ms`
        );
      }

      console.log(
        `Final lookup response received with code: ${lookupResult.PinDistSaleResponse.ResponseCode}`
      );

      return lookupResult;
    }
  }

  async performTransaction(
    transactionType,
    productId,
    references,
    amount,
    invoiceNo
  ) {
    let method;
    let params;
    let isPaymentService = false;

    console.log("Performing transaction:", transactionType);
    console.log("Product ID:", productId);
    const product = await this.getProductDetails(productId);

    switch (transactionType) {
      case "transactionType":
        method = "BillPaymentUserFee";
        isPaymentService = true;
        params = {
          Version: "01",
          TerminalId: this.pagoServiciosCredentials.terminalId,
          ClerkId: this.pagoServiciosCredentials.clerkId,
          ProductId: productId,
          Amount: amount,
          AccountId: references,
          InvoiceNo: invoiceNo,
          LanguageOption: "1",
        };
        break;
      case "recharge":
        method = "PinDistSale";
        params = {
          Version: "01",
          SiteId: this.recargasCredentials.terminalId,
          ClerkId: this.recargasCredentials.clerkId,
          ProductId: productId,
          AccountId: references.reference1,
          Amount: amount,
          InvoiceNo: invoiceNo,
          LanguageOption: "1",
        };

        break;
      default:
        throw new Error(`Unsupported transaction type: ${transactionType}`);
    }

    return this.makeSOAPRequest(method, params, isPaymentService);
  }

  async getProductDetails(productId) {
    const products = await this.getPaymentServices();
    return products.find((p) => p.ProductId === productId);
  }

  constructAccountId(product, references) {
    let accountId = "";
    if (product.ReferenceParameters.Reference1) {
      accountId += references.reference1 || "";
    }
    if (product.ReferenceParameters.Reference2) {
      if (Array.isArray(product.ReferenceParameters.Reference2)) {
        const ref2 = product.ReferenceParameters.Reference2.find(
          (r) =>
            references.reference2 &&
            references.reference2.length >= r.LengthMin &&
            references.reference2.length <= r.LengthMax
        );
        if (ref2) {
          accountId += ref2.Prefix + references.reference2;
        }
      } else {
        accountId +=
          product.ReferenceParameters.Reference2.Prefix +
          (references.reference2 || "");
      }
    }
    return accountId;
  }

  async lookupTransaction(invoiceNo, isPaymentService = false) {
    const credentials = isPaymentService
      ? this.pagoServiciosCredentials
      : this.recargasCredentials;
    const params = {
      Version: "01",
      TerminalId: credentials.terminalId,
      ClerkId: credentials.clerkId,
      InvoiceNo: invoiceNo,
    };

    return this.makeSOAPRequest(
      "LookUpTransactionByInvocieNo",
      params,
      isPaymentService
    );
  }

  async getAccountBalance(isPaymentService = false) {
    const credentials = isPaymentService
      ? this.pagoServiciosCredentials
      : this.recargasCredentials;
    const params = {
      version: "01",
      terminalId: credentials.terminalId,
      merchantId: credentials.merchantId,
    };

    try {
      const response = await this.makeSOAPRequest(
        "GetAccountBalance",
        params,
        isPaymentService
      );

      if (response && response.GetAccountBalanceResponse) {
        return {
          siteId: response.GetAccountBalanceResponse.siteId,
          merchantId: response.GetAccountBalanceResponse.merchantId,
          legalBusinessName:
            response.GetAccountBalanceResponse.legalBusinessname,
          dba: response.GetAccountBalanceResponse.dba,
          availableBalance: response.GetAccountBalanceResponse.availableBalance,
        };
      } else {
        throw new Error("Unexpected account balance response structure");
      }
    } catch (error) {
      console.error("Error in getAccountBalance:", error);
      throw error;
    }
  }
}

module.exports = new EmidaService();
