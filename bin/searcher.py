#!/usr/bin/env python
import braintree

braintree.Configuration.configure(
    braintree.Environment.Sandbox,
    'dpvm2srq5sxw662q',
    'yb7fntb8zhjrk28z',
    'd9r3ph7jjvfn47ft'
)

result = braintree.Subscription.search(
    braintree.SubscriptionSearch.status == braintree.Subscription.Status.PastDue
#    braintree.SubscriptionSearch.status == braintree.Subscription.Status.Canceled
)

for sub in result.items:
    print sub.failure_count # if this is 2 we probably want to de-activate the page
    print sub.next_billing_date
    print sub.next_billing_period_amount
    print sub.paid_through_date
    print sub.balance
    print sub.payment_method_token 
    # sub.payment_method_token allows lookup of customer via creditCard.find. We can than de-activate a page until the issue is resolved
