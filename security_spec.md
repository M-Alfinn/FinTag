# Firebase Security Spec

## 1. Data Invariants
- Only authenticated users can create transactions, and they must be the owner (`userId` must match `auth.uid`).
- Transactions cannot be updated to change the `userId`.
- `userConfigs` can only be read/written by the owner (matching document ID).
- `products` can only be written by admins (`mhdalfinaja@mhs.unimed.ac.id`).
- `orders` can be created by authenticated users, but they can only read their own orders.
- `music` can only be written by admins.

## 2. The Dirty Dozen Payloads
1. **Malicious Transaction Creation**: User A tries to create a transaction with `userId` of User B.
2. **Transaction Spoofing**: User A tries to update User B's transaction amount.
3. **Budget Hijacking**: User A tries to read/write User B's `userConfigs`.
4. **Price Manipulation**: Authenticated user tries to update a `product` price.
5. **Order Interception**: User A tries to list User B's orders.
6. **Status Forgery**: User A tries to mark an order as 'selesai' without being an admin.
7. **Playlist Vandalism**: Authenticated user tries to delete a `music` entry.
8. **Shadow Field Injection**: Creating a transaction with a hidden `isAdmin: true` field.
9. **Identity Poisoning**: Using a 1MB string as a transaction ID.
10. **Immutable Violation**: Trying to change the `userId` field in an existing transaction.
11. **PII Leak**: Non-admin user trying to read all `userConfigs`.
12. **Anonymous Write**: Unauthenticated user trying to create a transaction.

## 3. Test Runner (Conceptual)
`firestore.rules.test.ts` would verify that all the above payloads return `PERMISSION_DENIED` when performed by unauthorized users.
