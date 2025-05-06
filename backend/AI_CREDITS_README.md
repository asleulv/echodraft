# AI Generation Credits Management

This document explains how to manage AI generation credits in the TextVault application.

## Bonus Credits

The system now supports adding bonus AI generation credits to organizations. These bonus credits:

- Are added on top of the base limit provided by the subscription plan
- Reset to zero at the end of each billing period
- Can be managed through the Django admin interface

## Admin Interface

You can manage bonus credits and view AI generation usage through the Django admin interface:

1. Go to the Django admin panel (`/admin/`)
2. Navigate to "Organizations" under the "Accounts" section
3. Find the organization you want to modify
4. You can view and edit the following fields:
   - `ai_generations_used`: The number of AI generations used this month
   - `bonus_ai_generation_credits`: Additional one-time AI generation credits
   - `ai_generation_limit`: (Read-only) The total AI generation limit (base + bonus)
   - `ai_generations_remaining`: (Read-only) The number of AI generations remaining

### Admin Actions

The admin interface now includes several actions to help manage AI generation credits:

1. **Add Bonus AI Generation Credits**
   - Select one or more organizations from the list
   - Choose "Add bonus AI generation credits" from the actions dropdown
   - Enter the number of credits to add
   - Click "Add Credits" to apply the changes

2. **Reset AI Generations Used Counter**
   - Select one or more organizations from the list
   - Choose "Reset AI generations used counter" from the actions dropdown
   - This will set the `ai_generations_used` counter back to 0

3. **Simulate Period End**
   - Select one or more organizations from the list
   - Choose "Simulate period end" from the actions dropdown
   - This will reset both the usage counter and bonus credits, simulating what happens at the end of a billing period

## Management Command

For testing and administrative purposes, a management command is provided to manipulate AI generation credits:

```bash
# List all organizations
python manage.py manage_ai_credits --list

# Add bonus credits to an organization
python manage.py manage_ai_credits --org_id=1 --add-bonus=50

# Set the number of used credits
python manage.py manage_ai_credits --org_name="Example Org" --set-used=25

# Force reset the credits counter (simulates period end)
python manage.py manage_ai_credits --org_id=1 --reset

# Set the subscription period end date (for testing period end behavior)
python manage.py manage_ai_credits --org_id=1 --set-period-end=2025-06-01

# Combine multiple operations
python manage.py manage_ai_credits --org_id=1 --add-bonus=50 --set-used=10
```

## Testing Period End Behavior

To test what happens at the end of a billing period:

1. Use the management command to set the subscription period end date to a date in the past:
   ```bash
   python manage.py manage_ai_credits --org_id=1 --set-period-end=2025-01-01
   ```

2. Force a reset of the credits counter:
   ```bash
   python manage.py manage_ai_credits --org_id=1 --reset
   ```

This will simulate what happens when a billing period ends:
- The `ai_generations_used` counter will be reset to 0
- Any bonus credits will be reset to 0
- A new reset date will be set for the 1st of the next month

## How Credits Work

1. Each subscription plan has a base AI generation limit:
   - Explorer: 3 generations per month
   - Creator: 100 generations per month
   - Master: 500 generations per month

2. Bonus credits are added on top of this base limit, creating a total limit:
   - Base Limit (from subscription plan) + Bonus Credits = Total Limit
   - The base limit represents the plan the user is on
   - The total limit is what's used to determine if a user can generate more content

3. When a user generates AI content, the `ai_generations_used` counter is incremented.

4. If a user has used all their available generations (reached the total limit), they will need to wait until the next billing period or upgrade their subscription.

5. At the end of each billing period, both the usage counter and bonus credits are reset.

## Admin Interface Changes

The admin interface now clearly distinguishes between:

- **Base AI Generation Limit**: The limit from the subscription plan
- **Bonus AI Generation Credits**: Additional one-time credits
- **Total AI Generation Limit**: The sum of the base limit and bonus credits

This makes it easier to understand that bonus credits don't change the user's subscription plan, they just provide additional generations for the current period.
