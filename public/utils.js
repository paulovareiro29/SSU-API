const db = require("../public/database");
const crypto = require("crypto");

module.exports = {
  generateToken() {
    return crypto
      .randomBytes(parseInt(process.env.ACCESS_TOKEN_SIZE))
      .toString("hex");
  },
  generateTokenTTL() {
    const now = new Date();
    now.setDate(now.getDate() + process.env.ACCESS_TOKEN_TTL);

    return parseInt(now.valueOf() / 1000);
  },

  sendResponse(res, status, data) {
    res.status(status).json({
      status: status,
      data: data,
    });
  },

  sendError(res, status, message) {
    res.status(status).json({
      status: status,
      data: null,
      message: message,
    });
  },

  log(title = null, message = null) {
    if (!title || !message) return;

    db("log")
      .insert({
        title: title,
        message: message,
      })
      .then(() => console.log("[LOG] ", title, " - ", message));
  },

  async isAdmin(res, user) {
    let role = await db("role").where({ name: "admin" }).first();

    if (!role) return this.sendError(res, 500, "SERVER ERROR");

    let userRole = await db("user_role")
      .where({
        user_id: user.id,
        role_id: role.id,
      })
      .first();

    if (!userRole || !userRole.active) return false;

    return true;
  },

  validateRequestModel(res, request, model) {
    const requiredValidation = model.required.validate(request);

    if (requiredValidation.error) {
      this.sendError(res, 400, requiredValidation.error.details[0].message);
      return false;
    }

    const validation = model.model.validate(request);

    if (validation.error) {
      this.sendError(res, 400, validation.error.details[0].message);
      return false;
    }


    return true
  },

  validateUpdateRequestModel(res, request, model){
    const validation = model.updateModel.validate(request);

    if (validation.error) {
      this.sendError(res, 400, validation.error.details[0].message);
      return false;
    }

    return true
  }
};
