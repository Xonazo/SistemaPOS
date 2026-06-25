// components/OrderPanel/PaymentSection.js
import React from "react";
import { useState } from "react";
import {
  X,
  Banknote,
  CreditCard,
  PiggyBank,
  Truck,
  Trash2,
} from "lucide-react";

const PaymentSection = ({
  subtotal,
  total,
  change,
  amountReceived,
  onAmountReceivedChange,
  onConfirmOrder,
  onPrintReceipt,
  orderDetails,
  onUpdateNotes,
  onPaymentMethodChange,
  paymentMethod,
  onDeliveryChange,
  delivery,
  deliveryCost,
  onResetAllOrder,
  onConsumptionTypeChange,  // ← nuevo prop
  consumptionType, 
}) => {
  const [displayAmount, setDisplayAmount] = useState("");

  const handleAmountChange = (e) => {
    const input = e.target.value.replace(/\./g, "");
    const numericValue = parseInt(input, 10);

    if (!isNaN(numericValue)) {
      const formatted = numericValue
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      setDisplayAmount(formatted);
      //setDisplayAmount(numericValue.toLocaleString('es-CL'));
      onAmountReceivedChange(numericValue);
    } else {
      setDisplayAmount("");
      onAmountReceivedChange(0);
    }
  };

  const handleConfirmOrder = () => {
    const ventaFinal = {
      items: orderDetails?.items || [],
      notas: orderDetails?.notes || "",
      subtotal,
      total,
      recibido: amountReceived,
      vuelto: change,
      consumo: consumptionType,
      timestamp: new Date().toISOString(),
    };

    // console.log('🧾 Venta final:', ventaFinal);

    onConfirmOrder();
    setDisplayAmount("");
    onAmountReceivedChange(0);
  };

  const handlePrintReceipt = () => {
    onPrintReceipt();
    setDisplayAmount("");
    onAmountReceivedChange(0);
  };

  const clearAmountField = () => {
    setDisplayAmount("");
    onAmountReceivedChange(0);
  };

  const QuickAmountButton = ({ amount, onSelect, label, icon: Icon }) => {
    const handleClick = () => {
      onSelect(amount);
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className="py-2 px-4 rounded-md bg-gray-200 hover:bg-gray-300 font-medium flex items-center justify-center gap-1"
      >
        {Icon && <Icon size={16} />}

        {label || `$${amount.toLocaleString("es-CL")}`}
      </button>
    );
  };

  const formatNumber = (num) => {
    if (typeof num !== "number") return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleQuickAmountSelect = (amount) => {
    setDisplayAmount(formatNumber(amount));
    onAmountReceivedChange(amount);
  };

  const handleDeliveryToggle = () => {
    onDeliveryChange({
      ...delivery,
      isDelivery: !delivery.isDelivery,
      zone: !delivery.isDelivery ? "zona1" : undefined,
    });
  };

  const handleZoneChange = (e) => {
    onDeliveryChange({
      ...delivery,
      zone: e.target.value,
    });
  };

  const canConfirmOrder = total > 0 && amountReceived >= total;

  const hasItems =
    orderDetails?.items?.length > 0 || delivery?.isDelivery === true;

  const handlePrintBoth = () => {
    onPrintReceipt();
    onConfirmOrder();
    setDisplayAmount("");
    onAmountReceivedChange(0);
  };

  return (
    <div className="bg-white rounded-md shadow-sm p-4 mt-4 ">
      <h2 className="text-lg font-semibold mb-2 text-black">Pago</h2>

      <div className="space-y-2 mb-2">
        <div className="flex justify-between">
          <span className="text-gray-800">Subtotal:</span>
          <span className="text-gray-900">
            ${subtotal.toLocaleString("es-CL")}
          </span>
        </div>
        <div className="flex justify-between font-bold text-lg text-gray-900">
          <span>Total:</span>
          <span>${total.toLocaleString("es-CL")}</span>
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Método de pago:
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => onPaymentMethodChange("efectivo")}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md ${
              paymentMethod === "efectivo"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Banknote className="w-5 h-5 mr-2" />
            Efectivo
          </button>
          <button
            onClick={() => onPaymentMethodChange("tarjeta")}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md ${
              paymentMethod === "tarjeta"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Tarjeta
          </button>
          <button
            onClick={() => onPaymentMethodChange("transferencia")}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md ${
              paymentMethod === "transferencia"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <PiggyBank className="w-5 h-5 mr-2" />
            Transferencia
          </button>
        </div>
      </div>

    {!delivery.isDelivery && (
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de consumo:
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => onConsumptionTypeChange('servir')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md ${
              consumptionType === 'servir'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
             Para Servir
          </button>
          <button
            onClick={() => onConsumptionTypeChange('llevar')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md ${
              consumptionType === 'llevar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
             Para Llevar
          </button>
        </div>
      </div>
    )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de entrega:
        </label>
        <div className="flex space-x-2 mb-2">
          <button
            onClick={handleDeliveryToggle}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md ${
              delivery.isDelivery
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Truck className="w-5 h-5 mr-2" />
            {delivery.isDelivery ? "Delivery" : "Retiro en local"}
          </button>
        </div>
        {delivery.isDelivery && (
          <div className="mt-2">
            <select
              value={delivery.zone}
              onChange={handleZoneChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="zona1">$1,500</option>
              <option value="zona2">$2,000</option>
              <option value="zona3">$2,500</option>
              <option value="zona4">$3,000</option>
            </select>
          </div>
        )}
      </div>

      {paymentMethod === "efectivo" && (
        <div className="mb-4 text-black">
          <label
            htmlFor="amountReceived"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Cantidad recibida:
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>

            <input
              id="amountReceived"
              type="text"
              value={displayAmount || ""}
              onChange={handleAmountChange}
              className="w-full pl-6 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              min="0"
              step="0.01"
              aria-label="Cantidad recibida"
              inputMode="numeric"
            />
          </div>
        </div>
      )}

      {paymentMethod === "efectivo" && (
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium text-black">Vuelto:</span>
          <span className="text-lg font-bold text-green-600">
            ${change.toLocaleString("es-CL")}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleConfirmOrder}
          disabled={!canConfirmOrder}
          className={`py-2 px-4 rounded-md font-bold ${
            canConfirmOrder
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Finalizar Venta e Imprimir (Ctrl+Enter)
        </button>
        <button
          onClick={handlePrintReceipt}
          disabled={!canConfirmOrder}
          className={`py-2 px-4 rounded-md font-bold ${
            canConfirmOrder
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Imprimir Orden Cocina (Ctrl+P)
        </button>

        <button
          onClick={handlePrintBoth}
          disabled={!canConfirmOrder}
          className={`py-2 px-4 rounded-md font-bold ${
            canConfirmOrder
              ? "bg-yellow-500 text-white hover:bg-yellow-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Finalizar Venta e Imprimir Cocina + Cliente (Ctrl+B)
        </button>
      </div>

      {/* Quick amount buttons */}
      {paymentMethod === "efectivo" && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <QuickAmountButton
            amount={total}
            onSelect={handleQuickAmountSelect}
            label="Exacto"
            icon={Banknote}
          />
          <QuickAmountButton
            amount={10000}
            onSelect={handleQuickAmountSelect}
            icon={Banknote}
          />
          <QuickAmountButton
            amount={20000}
            onSelect={handleQuickAmountSelect}
            icon={Banknote}
          />
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={onResetAllOrder}
          disabled={!hasItems}
          className={`w-full py-3 rounded-md font-semibold shadow-md flex items-center justify-center transition-colors duration-200
      ${
        hasItems
          ? "bg-red-500 text-white hover:bg-red-700 cursor-pointer"
          : "bg-gray-300 text-gray-500 cursor-not-allowed"
      }
    `}
          aria-label="Cancelar pedido"
          title="Cancelar pedido"
        >
          Cancelar Pedido (Ctrl+R)
        </button>
      </div>
    </div>
  );
};

export default PaymentSection;
