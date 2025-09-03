const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  customerPhone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  deliveryDate: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validar formato YYYY-MM-DD
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: 'deliveryDate debe tener formato YYYY-MM-DD'
    }
  },
  deliveryTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validar formato HH:MM
        return /^\d{2}:\d{2}$/.test(v);
      },
      message: 'deliveryTime debe tener formato HH:MM'
    }
  },
  items: [itemSchema],
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  totalAmount: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado'],
    default: 'pendiente'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejorar rendimiento
orderSchema.index({ deliveryDate: 1, deliveryTime: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ customerName: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual para fecha completa de entrega
orderSchema.virtual('deliveryDateTime').get(function() {
  // Verificar que ambos campos existan y sean válidos
  if (!this.deliveryDate || !this.deliveryTime) {
    return null;
  }
  
  try {
    // deliveryDate ya es string en formato YYYY-MM-DD
    return new Date(`${this.deliveryDate}T${this.deliveryTime}`);
  } catch (error) {
    console.log('Error creando fecha:', error);
    return null;
  }
});

// Método para obtener pedidos por fecha
orderSchema.statics.getByDeliveryDate = function(date) {
  // date debe estar en formato YYYY-MM-DD
  const targetDate = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
  return this.find({
    deliveryDate: targetDate
  }).sort({ deliveryTime: 1 });
};

// Método para obtener estadísticas
orderSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
