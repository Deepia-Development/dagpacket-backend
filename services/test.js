// Información de autenticación y detalles de la solicitud
const accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJtdkZCekZQZWhoRVp4Y01NMnE2bXpHU2htdnREOC0ySU9QUllxSUdQU3k4In0.eyJleHAiOjE3NDQxODc4NTksImlhdCI6MTc0NDE4NDI1OSwianRpIjoiYzE5YjYxMzMtYzMyYi00Yzk2LWIwNTYtZGI4N2ZkZWViNThiIiwiaXNzIjoiaHR0cHM6Ly9zc28uZGV2LmNsYXJvc2hvcC5jb20vYXV0aC9yZWFsbXMvY2xhcm9zaG9wLXNhcGktc2EtY3YiLCJhdWQiOlsia2VvcHMtbG9jYWwiLCJhY2NvdW50Il0sInN1YiI6Ijg4MTI0Zjk0LTQ1MWQtNDZiYS04NzM1LWM3NjZhYjY5MTJkYSIsInR5cCI6IkJlYXJlciIsImF6cCI6InQxZW52aW9zIiwic2Vzc2lvbl9zdGF0ZSI6ImQ0MmM3N2JhLWE1ODctNGVkMy1hYzBjLTdkMDdhMzRkMDRjMSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7Imtlb3BzLWxvY2FsIjp7InJvbGVzIjpbImN1c3RvbWVyIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6ImVtYWlsIHByb2ZpbGUiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImFkZHJlc3MiOnt9LCJuYW1lIjoiV2lsYmVydGggQW50b255IEhvbWJyZSBDYWh1aWNoIENydXoiLCJtb2JpbGUiOiIzMzM3MDI0ODY2IiwiZ3JvdXBzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXSwicHJlZmVycmVkX3VzZXJuYW1lIjoiZGVzYXJyb2xsb3dlYkBkYWdwYWNrZXQuY29tLm14IiwiZ2l2ZW5fbmFtZSI6IldpbGJlcnRoIEFudG9ueSBIb21icmUiLCJ1c2VyaWQiOiI4ODEyNGY5NC00NTFkLTQ2YmEtODczNS1jNzY2YWI2OTEyZGEiLCJmYW1pbHlfbmFtZSI6IkNhaHVpY2ggQ3J1eiIsImVtYWlsIjoiZGVzYXJyb2xsb3dlYkBkYWdwYWNrZXQuY29tLm14In0.dM1a1c1WvLUtp5teQOdIX_vEulzVnVmMOwpPzg1GrTun1HOMmdXyOm9xSUEvnX7RlHEyDH7CsEuPTQGziNMyDzNb5pYIm8wWN16mLKdCm8MZ4XIYrQfQQV67VZCQ5vBhHARCtlfyBPS5eWBIybFhpGnNblrkHgxk5GKPLVQejYPnuXEEUh3Gcge_GTlEXT9w8VPo4mEHpmuzrTw8dpFMVR_iWDKbxV_cNp0J6wkGafipxSJLt74MHXQOm-aphLhRqcvkfQ_u8Q3q2akBsZnLvuMk6URXpcz7u25G4LmNDhnrrQ9L4NqUbqLy01QLo87YPp0k5yKw7tSkkE7AjQ0h3g';  // Reemplázalo con tu token real
const shopId = '127000756';  // Reemplázalo con tu shop_id real
const quoteUrl = 'https://apiv2.dev.t1envios.com/quote/create';

// Detalles de envío que se envían en el cuerpo de la solicitud
const shipmentDetails =     {
    codigo_postal_origen: '44130',
    codigo_postal_destino: '45654',
    peso: 1,
    largo: 30,
    ancho: 25,
    alto: 1,
    dias_embarque: 1,
    seguro: false,
    valor_paquete: 0,
    tipo_paquete: 1,
    comercio_id: '127000756',
    paquetes: 1,
    generar_recoleccion: false
  }

// Hacer la solicitud POST usando fetch
async function getQuote() {
  try {
    const requestBody = JSON.stringify(shipmentDetails);

    const response = await fetch(quoteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'shop_id': shopId
      },
      body: requestBody
    });

    const data = await response.json();
    console.log('Respuesta de la cotización:', data);
  } catch (error) {
    console.error('Error al obtener la cotización:', error.message);
  }
}

// Llamar a la función
getQuote();
