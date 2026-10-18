// @ts-check

import { Strategy } from '@fastify/passport';
import _ from 'lodash';
import { findUserByEmail, verifyPassword } from '../users.js';

export default class FormStrategy extends Strategy {
  async authenticate(request) {
    if (request.isAuthenticated()) {
      return this.pass();
    }

    const email = _.get(request, 'body.data.email', null);
    const password = _.get(request, 'body.data.password', null);
    const user = await findUserByEmail(email);
    if (user && verifyPassword(user, password)) {
      return this.success(user);
    }

    return this.fail();
  }
}
