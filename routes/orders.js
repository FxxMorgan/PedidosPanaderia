const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const Order = require('../models/Order');
const moment = require('moment-timezone');

const router = express.Router();

// Middleware de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// Validaciones para crear/actualizar pedido
const orderValidation = [
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('El nombre del cliente es requerido')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres'),
  
  body('customerPhone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('El teléfono no puede exceder 20 caracteres'),
  
  body('deliveryDate')
    .isISO8601()
    .withMessage('Fecha de entrega inválida')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('La fecha de entrega no puede ser anterior a hoy');
      }
      return true;
    }),
  
  body('deliveryTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de entrega inválida (formato HH:MM)'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un producto'),
  
  body('items.*.product')
    .trim()
    .notEmpty()
    .withMessage('El nombre del producto es requerido'),
  
  body('items.*.quantity')
    .trim()
    .notEmpty()
    .withMessage('La cantidad es requerida'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres'),
  
  body('totalAmount')
    .optional()
    .trim(),
  
  body('status')
    .optional()
    .isIn(['pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado'])
    .withMessage('Estado inválido')
];

// GET /api/orders - Obtener todos los pedidos con filtros
router.get('/', [
  query('status').optional().isIn(['pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado']),
  query('date').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const { status, date, page = 1, limit = 50 } = req.query;
    
    // Construir filtros
    const filters = {};
    if (status) filters.status = status;
    if (date) {
      // Como deliveryDate es ahora String en formato YYYY-MM-DD
      filters.deliveryDate = date;
    }

    // Paginación
    const skip = (page - 1) * limit;
    
    // Ejecutar consulta
    const orders = await Order.find(filters)
      .sort({ deliveryDate: 1, deliveryTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filters);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error en GET /api/orders:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

// GET /api/orders/stats - Obtener estadísticas
router.get('/stats', async (req, res) => {
  try {
    const stats = await Order.getStats();
    const total = await Order.countDocuments();
    
    // Pedidos de hoy
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayOrders = await Order.countDocuments({
      deliveryDate: { $gte: today, $lt: tomorrow }
    });

    res.json({
      success: true,
      data: {
        total,
        todayOrders,
        byStatus: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

// GET /api/orders/:id - Obtener un pedido específico
router.get('/:id', [
  param('id').isMongoId().withMessage('ID de pedido inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el pedido',
      error: error.message
    });
  }
});

// POST /api/orders - Crear nuevo pedido
router.post('/', orderValidation, handleValidationErrors, async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear el pedido',
      error: error.message
    });
  }
});

// PUT /api/orders/:id - Actualizar pedido
router.put('/:id', [
  param('id').isMongoId().withMessage('ID de pedido inválido'),
  ...orderValidation
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Pedido actualizado exitosamente',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el pedido',
      error: error.message
    });
  }
});

// PATCH /api/orders/:id/status - Actualizar solo el estado
router.patch('/:id/status', [
  param('id').isMongoId().withMessage('ID de pedido inválido'),
  body('status').isIn(['pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado']).withMessage('Estado inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado',
      error: error.message
    });
  }
});

// DELETE /api/orders/:id - Eliminar pedido
router.delete('/:id', [
  param('id').isMongoId().withMessage('ID de pedido inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Pedido eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el pedido',
      error: error.message
    });
  }
});

module.exports = router;
