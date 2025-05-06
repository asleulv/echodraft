from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0002_initial_data'),
    ]

    operations = [
        migrations.AlterField(
            model_name='subscriptionevent',
            name='event_type',
            field=models.CharField(
                choices=[
                    ('subscription_created', 'Subscription Created'),
                    ('subscription_updated', 'Subscription Updated'),
                    ('subscription_cancelled', 'Subscription Cancelled'),
                    ('subscription_cancelled_by_upgrade', 'Subscription Cancelled By Upgrade'),
                    ('payment_succeeded', 'Payment Succeeded'),
                    ('payment_failed', 'Payment Failed'),
                    ('trial_started', 'Trial Started'),
                    ('trial_ended', 'Trial Ended'),
                ],
                max_length=50,
                verbose_name='Event Type'
            ),
        ),
    ]
