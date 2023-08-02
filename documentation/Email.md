## Email

The backend sends emails about account administration (veryfing emails, resetting passwords), and downloads.

By default, the backend will use the django console backend for emails, so any outgoing mail will be displayed on your console.

If you want to use a server like [maildev](https://maildev.github.io/maildev/), you can configure a different email backend in your local settings, for example:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = '0.0.0.0'
EMAIL_PORT = '1025'
```
