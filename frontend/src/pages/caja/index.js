import React, { useState, useEffect } from 'react';
import ProductPanel from '../../components/ProductPanel/ProductPanel';
import OrderPanel from '../../components/OrderPanel/OrderPanel';
import KeyboardShortcuts from '../../components/KeyboardShortcuts';
import NavBar from '../../components/NavBar';
import ProtectedRoute from '../../components/protectedRoute';


//import { products } from '../../data/products';
import axios from 'axios';

import apiService from '../../services/api';


import { ToastContainer, toast, Bounce } from 'react-toastify';




function calculateOrderTotals(items, amountReceived, delivery) {
  const subtotal = items.reduce((sum, item) => {
    const notesPrice = item.notes.reduce((noteSum, note) => noteSum + (note.price || 0), 0);
    return sum + ((item.product.price + notesPrice) * item.quantity);
  }, 0);

  let deliveryCost = 0;
  if (delivery.isDelivery) {
    switch (delivery.zone) {
      case 'zona1':
        deliveryCost = 1500;
        break;
      case 'zona2':
        deliveryCost = 2000;
        break;
      case 'zona3':
        deliveryCost = 2500;
        break;
      case 'zona4':
        deliveryCost = 3000;
        break;
      default:
        deliveryCost = 0;
    }
  }



  const total = subtotal + deliveryCost;
  const change = Math.max(0, amountReceived - total);

  return {
    subtotal,
    total,
    change,
    deliveryCost,
  };
}

function areNotesEqual(notesA, notesB) {
  console.log("Comparando notas A:", notesA, "con B:", notesB);

  if (notesA.length !== notesB.length) return false;
  const sortedA = [...notesA].sort((a, b) => a.name.localeCompare(b.name));
  const sortedB = [...notesB].sort((a, b) => a.name.localeCompare(b.name));
  return sortedA.every((note, i) =>
    note.name === sortedB[i].name && note.price === sortedB[i].price
  );
}

function generateUid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}


function addProductToOrder(currentItems, product, notes = []) {
  const existingItemIndex = currentItems.findIndex(item =>
    item.product.id === product.id && areNotesEqual(item.notes, notes)
  );

  if (existingItemIndex !== -1) {
    return currentItems.map((item, index) =>
      index === existingItemIndex
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  } else {
    return [
      ...currentItems,
      { uid: generateUid(), product, quantity: 1, notes }
    ];
  }
}
// Función para actualizar la cantidad de un producto
function updateOrderItemQuantity(currentItems, productId, newQuantity) {
  if (newQuantity <= 0) {
    return removeOrderItem(currentItems, productId);
  }

  return currentItems.map(item =>
    item.product.id === productId
      ? { ...item, quantity: newQuantity }
      : item
  );
}



// Nueva función para actualizar las notas de un ítem
function updateOrderItemNotes(currentItems, productId, newNotes) {
  return currentItems.map(item =>
    item.product.id === productId
      ? { ...item, notes: newNotes }
      : item
  );
}

function removeOrderItem(currentItems, uid) {
  return currentItems.filter(item => item.uid !== uid);
}
function printReceipt(order) {
  console.log('Imprimiendo recibo...');
  console.log('Orden:', order);
  window.print();
}

export default function Home() {
  const [orderItems, setOrderItems] = useState([]);
  const [amountReceived, setAmountReceived] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [delivery, setDelivery] = useState({ isDelivery: false });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consumptionType, setConsumptionType] = useState('servir');



  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        //setError(null);

        const data = await apiService.getProducts();
        const productsData = data.products || data.data || data || [];
        setProducts(productsData);

        console.log('Productos cargados:', productsData);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        //setError('Error al cargar los productos');
        setProducts([]);

        toast.error('Error al cargar los productos', {
          position: "bottom-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
          transition: Bounce,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);






  const { subtotal, tax, total, change, deliveryCost } = calculateOrderTotals(orderItems, amountReceived, delivery);

  const handleAddToOrder = (product) => {
    setOrderItems(currentItems => addProductToOrder(currentItems, product));
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    setOrderItems(currentItems => updateOrderItemQuantity(currentItems, productId, newQuantity));
  };

  const handleRemoveItem = (productId, notes) => {
    console.log("Eliminando", productId, notes);
    setOrderItems(currentItems =>
      removeOrderItem(currentItems, productId, notes)
    );
  };
  const handleAmountReceivedChange = (amount) => {
    setAmountReceived(amount);
  };

  const handleDeliveryChange = (newDelivery) => {
    setDelivery(newDelivery);
  };


  const handleConfirmOrder = async () => {

    console.log(orderItems)


    const cleanItems = orderItems.map(({ product, quantity, notes }) => ({
      product_id: product.id,
      quantity,
      notes: notes || [], // nos aseguramos de que notes esté presente
    }));

    const ventaFinal = {
      items: cleanItems,
      subtotal,
      total,
      amountReceived,
      change,
      paymentMethod,
      timestamp: new Date().toISOString(),
      delivery: delivery.isDelivery,
      deliveryCost: delivery.isDelivery ? deliveryCost : 0,
    };

    const payload = {
      items: cleanItems,
      subtotal: ventaFinal.subtotal,
      total: ventaFinal.total,
      amount_received: ventaFinal.amountReceived,
      change_amount: ventaFinal.change,
      payment_method: ventaFinal.paymentMethod,
      timestamp: ventaFinal.timestamp,
      delivery: ventaFinal.delivery ? 1 : 0,  // si en BD es INTEGER 0 o 1
      delivery_cost: ventaFinal.deliveryCost,
      consumption_type: delivery.isDelivery ? 'llevar' : consumptionType,
    };

    console.log('🧾 Venta final:', payload);



    await saveSale(payload);
    // Imprimir ticket de cocina
    await printSale(payload);

    // Limpiar el pedido
    setOrderItems([]);
    setPaymentMethod();
    setDelivery({ isDelivery: false, zone: 'zona1' });
    setAmountReceived(0);
    setConsumptionType('servir');

    //alert('¡Pedido confirmado y enviado a cocina!');
  };


  const saveSale = async (ventaFinal) => {
    try {
      console.log('Guardando venta final:', ventaFinal);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/orders`,
        ventaFinal,
        {
          withCredentials: true, // <--- Aquí agregas esta opción
        }
      ); console.log('Respuesta del backend:', response.data);

    } catch (error) {
      console.error('Error al guardar la venta:', error);
      toast.error('Error al guardar la venta', {
        position: "bottom-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
      //alert('Error al guardar la venta');
    }
  };




  const printKitchen = async (ventaFinal) => {
    try {
      console.log('Imprimiendo ticket de cocina:', ventaFinal);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/printer/print-kitchen`,
        ventaFinal,
        {
          withCredentials: true,
        }
      );
      console.log('Respuesta del backend (cocina):', response.data);
      //alert('Ticket de cocina impreso correctamente');

      toast.success('Ticket de cocina impreso correctamente!', {
        position: "bottom-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });


    } catch (error) {
      console.error('Error al imprimir ticket de cocina:', error);
      alert('Error al imprimir ticket de cocina');
    }
  };

  const printSale = async (ventaFinal) => {
    try {
      console.log('Imprimiendo ticket de venta:', ventaFinal);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/printer/print-sale`,
        ventaFinal,
        {
          withCredentials: true,
        }
      );
      console.log('Respuesta del backend (venta):', response.data);
      toast.success('Venta Realizada Con exito!', {
        position: "bottom-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
      //alert('Ticket de venta impreso correctamente');
    } catch (error) {
      console.error('Error al imprimir ticket de venta:', error);
      alert('Error al imprimir ticket de venta');
    }
  };

  const resetAllOrder = () => {
    setOrderItems([]);
    setPaymentMethod('');
    setAmountReceived(0);
    setConsumptionType('servir');

    setDelivery({ isDelivery: false, zone: 'zona1' });

  };


  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);

    if (method === 'tarjeta' || method === 'transferencia') {
      setAmountReceived(total);
    } else {
      setAmountReceived(0);
    }
  };


  useEffect(() => {
    if (orderItems.length === 0) {
      // setPaymentMethod('efectivo');
      setAmountReceived(0);
    }
  }, [orderItems]);



  // Aquí la función que estabas usando pero sin definir
  const handleUpdateNotes = (productId, notes) => {
    setOrderItems(currentItems => updateOrderItemNotes(currentItems, productId, notes));
  };

  // Función para imprimir recibo completo (ticket de venta)
  const handlePrintReceipt = async () => {
    const ventaFinal = {
      items: orderItems,
      subtotal,
      total,
      amountReceived,
      change,
      paymentMethod,
      timestamp: new Date().toISOString(),
      delivery: delivery.isDelivery,
      deliveryCost: delivery.isDelivery ? deliveryCost : 0,
      consumption_type: delivery.isDelivery ? 'llevar' : consumptionType,
    };

    // Imprimir ticket de venta
    await printKitchen(ventaFinal);


    // Limpiar el pedido
    setOrderItems([]);
    setPaymentMethod('efectivo');
    setDelivery({ isDelivery: false, zone: 'zona1' });
    setAmountReceived(0);
    setConsumptionType('servir');

  };

  const handlePrintBoth = async () => {
    const ventaFinal = {
      items: orderItems,
      subtotal,
      total,
      amountReceived,
      change,
      paymentMethod,
      timestamp: new Date().toISOString(),
      delivery: delivery.isDelivery,
      deliveryCost: delivery.isDelivery ? deliveryCost : 0,
      consumption_type: delivery.isDelivery ? 'llevar' : consumptionType,
    };

    try {
      // Imprimir ambos tickets
      await Promise.all([
        printKitchen(ventaFinal),
        printSale(ventaFinal)
      ]);

      toast.success('Tickets Imprimidos Correctamente!', {
        position: "bottom-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });

      // Limpiar el pedido
      setOrderItems([]);
      setPaymentMethod('efectivo');
      setDelivery({ isDelivery: false, zone: 'zona1' });
      setAmountReceived(0);
      setConsumptionType('servir');


      //alert('Ambos tickets impresos correctamente');
    } catch (error) {
      console.error('Error al imprimir tickets:', error);
      alert('Error al imprimir algunos tickets');
    }
  };


  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if ((paymentMethod === 'tarjeta' || amountReceived >= total) && total > 0) {
          handleConfirmOrder();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if ((paymentMethod === 'tarjeta' || amountReceived >= total) && total > 0) {
          handlePrintReceipt();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (orderItems.length > 0) {
          resetAllOrder();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paymentMethod, amountReceived, total, orderItems, handlePrintReceipt, resetAllOrder]);

  return (
    <ProtectedRoute>

      <div className=" flex flex-col h-screen bg-blue-900 pt-19 px-4">
        <NavBar />

      <div className="w-full max-w-[1536px] mx-auto bg-white rounded-xl shadow-2xl flex flex-col flex-1 min-h-0">
    <div className="flex flex-col md:flex-row flex-grow">
            {/* Products panel (left side) */}
      <div className="w-full md:w-3/5 p-4 overflow-y-auto">
              <ProductPanel
                products={products}
                onAddToOrder={handleAddToOrder}
              />
            </div>
            {/* Order panel (right side) */}
            <div className="w-full md:w-2/5 p-4 bg-gray-50 border-l border-gray-200 ">
              <OrderPanel
                items={orderItems}
                subtotal={subtotal}
                tax={tax}
                total={total}
                change={change}
                amountReceived={amountReceived}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onAmountReceivedChange={handleAmountReceivedChange}
                onConfirmOrder={handleConfirmOrder}
                onPrintReceipt={handlePrintReceipt}
                onUpdateNotes={handleUpdateNotes}
                onPaymentMethodChange={handlePaymentMethodChange}
                paymentMethod={paymentMethod}
                onDeliveryChange={handleDeliveryChange}
                delivery={delivery}
                deliveryCost={deliveryCost}
                onResetAllOrder={resetAllOrder}
                onPrintBoth={handlePrintBoth}
                consumptionType={consumptionType}
                onConsumptionTypeChange={setConsumptionType}


              />
            </div>
          </div>

        </div>

        <KeyboardShortcuts />
        <ToastContainer />

      </div>
    </ProtectedRoute>

  );
}