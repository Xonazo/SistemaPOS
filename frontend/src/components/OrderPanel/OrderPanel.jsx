// components/OrderPanel/OrderPanel.js
import React from 'react';
import OrderSummary from './OrderSumary';
import PaymentSection from './PaymentSection';

const OrderPanel = ({
  items,
  subtotal,
  tax,
  total,
  change,
  amountReceived,
  onUpdateQuantity,
  onRemoveItem,
  onAmountReceivedChange,
  onConfirmOrder,
  onPrintReceipt,
  onUpdateNotes,
  onEditItem,
  notes,
  onPaymentMethodChange,
  paymentMethod,
  onDeliveryChange,
  delivery,
  deliveryCost,
  onResetAllOrder,
  onPrintBoth,
  consumptionType,
  onConsumptionTypeChange,

  


}) => {

  const orderDetails = {
    items,
    notes: notes || '',
  };





  return (
    <div className="bg-gray-100 rounded-lg p-4 h-full">
      <h1 className="text-2xl font-bold mb-4 text-blue-900">Pedido Actual</h1>

      <OrderSummary
        items={items}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
        onUpdateNotes={onUpdateNotes}
        onEditItem={onEditItem}

      />

      <PaymentSection
        subtotal={subtotal}
        tax={tax}
        total={total}
        change={change}
        amountReceived={amountReceived}
        onAmountReceivedChange={onAmountReceivedChange}
        onConfirmOrder={onConfirmOrder}
        onPrintReceipt={onPrintReceipt}
        orderDetails={orderDetails}
        onPaymentMethodChange={onPaymentMethodChange}
        paymentMethod={paymentMethod}
        onDeliveryChange={onDeliveryChange}
        delivery={delivery}
        deliveryCost={deliveryCost}
        onResetAllOrder={onResetAllOrder}
        onPrintBoth={onPrintBoth}
        consumptionType={consumptionType}
        onConsumptionTypeChange={onConsumptionTypeChange}


      />
    </div>
  );
};

export default OrderPanel;