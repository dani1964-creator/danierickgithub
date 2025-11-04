"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertySearchSchema = exports.contactFormSchema = exports.checkRateLimit = exports.validateLength = exports.validateRequired = exports.validatePhone = exports.validateEmail = exports.sanitizeHtml = exports.sanitizeInput = void 0;
const dompurify_1 = __importDefault(require("dompurify"));
// Input sanitization functions
const sanitizeInput = (input) => {
    if (!input)
        return '';
    // Remove any HTML tags and encode special characters
    return dompurify_1.default.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });
};
exports.sanitizeInput = sanitizeInput;
const sanitizeHtml = (html) => {
    if (!html)
        return '';
    // Allow only safe HTML tags
    return dompurify_1.default.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
        ALLOWED_ATTR: []
    });
};
exports.sanitizeHtml = sanitizeHtml;
// Input validation functions
const validateEmail = (email) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePhone = (phone) => {
    if (!phone)
        return true; // Phone is optional
    const phoneRegex = /^[\d\s\-()+]+$/;
    return phoneRegex.test(phone);
};
exports.validatePhone = validatePhone;
const validateRequired = (value) => {
    return Boolean(value && value.trim().length > 0);
};
exports.validateRequired = validateRequired;
const validateLength = (value, maxLength) => {
    return value.length <= maxLength;
};
exports.validateLength = validateLength;
// Rate limiting helper (simple in-memory implementation)
const rateLimitStore = new Map();
const checkRateLimit = (identifier, maxRequests = 5, windowMs = 60000) => {
    const now = Date.now();
    const record = rateLimitStore.get(identifier);
    if (!record || now > record.resetTime) {
        rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
    }
    if (record.count >= maxRequests) {
        return false;
    }
    record.count++;
    return true;
};
exports.checkRateLimit = checkRateLimit;
// Form validation schemas
exports.contactFormSchema = {
    name: (value) => (0, exports.validateRequired)(value) && (0, exports.validateLength)(value, 100),
    email: (value) => (0, exports.validateRequired)(value) && (0, exports.validateEmail)(value),
    phone: (value) => (0, exports.validatePhone)(value),
    message: (value) => (0, exports.validateLength)(value, 2000)
};
exports.propertySearchSchema = {
    search: (value) => (0, exports.validateLength)(value, 200),
    minPrice: (value) => !value || !isNaN(Number(value)),
    maxPrice: (value) => !value || !isNaN(Number(value))
};
