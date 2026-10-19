// @ts-check

import i18next from 'i18next';

export default (app) => {
    app
        .get('/sessions/new', { name: 'newSession' }, (_req, reply) => {
            reply.render('session/new');
        })
        .post(
            '/sessions',
            {
                name: 'createSession',
                preHandler: app.fp.authenticate('form', {
                    failureRedirect: app.reverse('newSession'),
                    failureFlash: i18next.t('flash.session.create.error'),
                }),
            },
            (req, reply) => {
                req.flash('success', i18next.t('flash.session.create.success'));
                reply.redirect(app.reverse('root'));
            },
        );
};
