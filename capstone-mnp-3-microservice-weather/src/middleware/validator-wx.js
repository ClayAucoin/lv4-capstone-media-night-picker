// src/utils/validators-wx.js

import { sendError } from "../utils/sendError.js"

export function validateWeatherVars(req, res, next) {
  const errors = [];

  const { zip, date } = req.body

  // ---- zip validation ----
  if (!zip) {
    errors.push({ field: 'zip', message: 'zip is required', value: zip })
  } else if (!/^\d{5}$/.test(String(zip))) {
    errors.push({ field: 'zip', message: 'zip must be a 5-digit US ZIP code', value: zip })
  }

  // ---- date validation ----
  if (!date) {
    errors.push({ field: 'date', message: 'date is required (YYYY-MM-DD)', value: date })
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push({ field: 'date', message: 'date must be in YYYY-MM-DD format', value: date })
  } else {
    const [yearStr, monthStr, dayStr] = date.split('-');

    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    // year range
    if (!Number.isInteger(year) || year < 1970 || year > 2150) {
      errors.push({ field: 'date', message: 'year must be between 1970 and 2050', value: date })
    }

    // month range
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      errors.push({ field: 'date', message: 'month must be between 01 and 12', value: date })
    }

    // day range
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      errors.push({ field: 'date', message: 'day must be between 01 and 31', value: date })
    }

    // date validation (no Feb 30, etc.)
    if (errors.length === 0) {
      const testDate = new Date(year, month - 1, day);

      const valid =
        testDate.getFullYear() === year &&
        testDate.getMonth() === month - 1 &&
        testDate.getDate() === day;

      if (!valid) {
        errors.push({ field: 'date', message: 'invalid calendar date', value: date })
      }
    }

    // normalized values for returning req
    if (errors.length === 0) {
      req.weatherParams = {
        dateString: `${year}-${monthStr}-${dayStr}`,
        zip: String(zip)
      }
    }
  }

  // ---- return errors if any ----
  if (errors.length > 0) {
    return next(sendError(422, "Invalid request parameters", "VALIDATION_ERROR", errors))
  }

  return next();
}
