const escpos = require('escpos');
escpos.USB = require('escpos-usb');

function printText(content) {
    return new Promise((resolve, reject) => {
        const devices = escpos.USB.findPrinter();


        if(!devices || devices.length === 0) {
            console.log('No hay impresora USB térmica conectada');
            return resolve('No hay impresora USB térmica conectada');
        }

        // if (!devices || devices.length === 0) {
        //     return reject('No hay impresora USB térmica conectada');
        // }



        console.log('llego aqui 1')
        const deviceInfo = devices[0];
        console.log(deviceInfo)
        console.log('llego aqui 2')
        const device = new escpos.USB(deviceInfo);
        console.log('llego aqui 3')


        const printer = new escpos.Printer(device);
        console.log('llego aqui 4')

        const prueba = ` DONDE LA TINA
------------------------------
Fecha: 24-05-2025
Hora: 19:49

PRODUCTOS:
- Completo Palta Mayo    $2.400
    > Sin tomate (+$0)
    > Extra queso (+$500)
    > Para llevar (+$0)
- Sándwich Barros Luco   $4.800
- Sándwich Ave Palta     $4.300
- Agua Mineral           $1.200
- Bebida 1.5L            $2.500
- Bebida Lata 350ml      $1.500

------------------------------
SUBTOTAL:               $17.200
Delivery:               $3.000
TOTAL:                 $20.200
------------------------------
Pago en efectivo:      $30.000
Vuelto:                 $9.800
------------------------------

Método de pago: EFECTIVO
Entrega a domicilio: SI
Gracias por su compra! 
¡Vuelva pronto!
`

        device.open((error) => {
            if (error) return reject(error);

            printer
                .encode('ISO8859-1')
                .text(content)
                .cut()
                .close(() => resolve('Impresión térmica realizada correctamente'));
        });
    });
}

module.exports = printText;
