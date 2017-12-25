import Joi from 'joi';

export default {
  // POST /api/users
  example2: {
    body: {
      derp: Joi.string().required(),
    }
  },

  // // UPDATE /api/users/:userId
  // updateUser: {
  //   body: {
  //     username: Joi.string().required(),
  //     mobileNumber: Joi.string().regex(/^[1-9][0-9]{9}$/).required()
  //   },
  //   params: {
  //     userId: Joi.string().hex().required()
  //   }
  // },
  //
  // // POST /api/auth/login
  // login: {
  //   body: {
  //     username: Joi.string().required(),
  //     password: Joi.string().required()
  //   }
  // }
};
