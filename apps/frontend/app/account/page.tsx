"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Address,
  CreateAddressInput,
  User,
  createMyAddress,
  deleteMyAddress,
  getMe,
  getMyAddresses,
  updateMe,
  updateMyAddress
} from "../../src/lib/api";
import { getSession, isAuthConfigured, signOut, startLogin } from "../../src/lib/auth";
import { formatDateTime } from "../../src/lib/format";

const emptyAddressForm: CreateAddressInput = {
  label: "",
  recipientName: "",
  line1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  phone: "",
  isDefaultShipping: false,
  isDefaultBilling: false
};

function compactAddressForm(input: CreateAddressInput): CreateAddressInput {
  return {
    label: input.label?.trim() || undefined,
    recipientName: input.recipientName.trim(),
    line1: input.line1.trim(),
    line2: input.line2?.trim() || undefined,
    city: input.city.trim(),
    state: input.state?.trim() || undefined,
    postalCode: input.postalCode.trim(),
    country: input.country.trim().toUpperCase(),
    phone: input.phone?.trim() || undefined,
    isDefaultShipping: input.isDefaultShipping,
    isDefaultBilling: input.isDefaultBilling
  };
}

export default function AccountPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: ""
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressForm, setAddressForm] = useState<CreateAddressInput>(emptyAddressForm);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadAccount();
  }, []);

  async function loadAccount() {
    setIsLoading(true);
    setError(null);
    setNeedsSignIn(false);

    if (!isAuthConfigured()) {
      setCurrentUser(null);
      setAddresses([]);
      setError("Auth is not configured");
      setIsLoading(false);
      return;
    }

    if (!getSession()) {
      setCurrentUser(null);
      setAddresses([]);
      setNeedsSignIn(true);
      setIsLoading(false);
      return;
    }

    try {
      const [user, nextAddresses] = await Promise.all([getMe(), getMyAddresses()]);

      setCurrentUser(user);
      setProfileForm({
        name: user.name ?? "",
        phone: user.phone ?? ""
      });
      setAddresses(nextAddresses);
      setAddressForm((current) => ({
        ...current,
        recipientName: current.recipientName || user.name || "",
        phone: current.phone || user.phone || ""
      }));
    } catch (caught) {
      setCurrentUser(null);
      setAddresses([]);
      setError(caught instanceof Error ? caught.message : "Could not load account");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("profile");
    setError(null);

    try {
      const user = await updateMe({
        name: profileForm.name.trim() || null,
        phone: profileForm.phone.trim() || null
      });
      setCurrentUser(user);
      setProfileForm({
        name: user.name ?? "",
        phone: user.phone ?? ""
      });
      setAddressForm((current) => ({
        ...current,
        recipientName: current.recipientName || user.name || "",
        phone: current.phone || user.phone || ""
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update profile");
    } finally {
      setPendingAction(null);
    }
  }

  async function refreshAddresses() {
    setPendingAction("addresses");
    setError(null);

    try {
      setAddresses(await getMyAddresses());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not refresh addresses");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleAddressSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("address-create");
    setError(null);

    try {
      await createMyAddress(compactAddressForm(addressForm));
      setAddressForm(emptyAddressForm);
      setAddresses(await getMyAddresses());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save address");
    } finally {
      setPendingAction(null);
    }
  }

  async function setDefaultAddress(addressId: string, type: "shipping" | "billing") {
    setPendingAction(`${type}-${addressId}`);
    setError(null);

    try {
      await updateMyAddress(addressId, {
        isDefaultShipping: type === "shipping" ? true : undefined,
        isDefaultBilling: type === "billing" ? true : undefined
      });
      setAddresses(await getMyAddresses());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update address");
    } finally {
      setPendingAction(null);
    }
  }

  async function removeAddress(addressId: string) {
    setPendingAction(`delete-${addressId}`);
    setError(null);

    try {
      await deleteMyAddress(addressId);
      setAddresses(await getMyAddresses());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete address");
    } finally {
      setPendingAction(null);
    }
  }

  function updateAddressForm(field: keyof CreateAddressInput, value: string | boolean) {
    setAddressForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  return (
    <main className="shell">
      <section className="topbar" aria-label="Account navigation">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Account</h1>
        </div>
        <div className="nav-actions">
          <Link className="nav-link" href="/">
            Shop
          </Link>
          <Link className="nav-link" href="/orders">
            Orders
          </Link>
          {currentUser ? (
            <button className="secondary" type="button" onClick={signOut}>
              Sign Out
            </button>
          ) : null}
        </div>
      </section>

      {error ? <p className="error global-error">{error}</p> : null}

      {needsSignIn ? (
        <section className="panel account-sign-in" aria-label="Sign in">
          <div>
            <p className="eyebrow">Sign in required</p>
            <h2>Manage your account</h2>
          </div>
          <div className="auth-actions">
            <button type="button" onClick={() => void startLogin()}>
              Sign In
            </button>
            <Link className="nav-link" href="/auth/confirm">
              Confirm Account
            </Link>
          </div>
        </section>
      ) : null}

      {!currentUser && isLoading ? (
        <section className="panel">
          <div className="empty-state compact">Loading account</div>
        </section>
      ) : null}

      {currentUser ? (
        <>
          <section className="summary-grid" aria-label="Account summary">
            <div className="metric wide">
              <span>Signed In</span>
              <strong>{currentUser.email}</strong>
            </div>
            <div className="metric">
              <span>Addresses</span>
              <strong>{addresses.length}</strong>
            </div>
            <div className="metric">
              <span>Shipping</span>
              <strong>{addresses.some((address) => address.isDefaultShipping) ? "Set" : "Not Set"}</strong>
            </div>
            <div className="metric">
              <span>Customer Since</span>
              <strong>{formatDateTime(currentUser.createdAt)}</strong>
            </div>
          </section>

          <section className="account-layout">
            <section className="panel account-profile" aria-label="Profile">
              <div className="panel-heading">
                <h2>Profile</h2>
              </div>
              <dl className="order-meta">
                <div>
                  <dt>Email</dt>
                  <dd>{currentUser.email}</dd>
                </div>
                <div>
                  <dt>Name</dt>
                  <dd>{currentUser.name ?? "Not set"}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{currentUser.phone ?? "Not set"}</dd>
                </div>
                <div>
                  <dt>Customer Since</dt>
                  <dd>{formatDateTime(currentUser.createdAt)}</dd>
                </div>
              </dl>
              <form className="checkout-form" onSubmit={handleProfileSubmit}>
                <label>
                  <span>Name</span>
                  <input
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                    placeholder="Customer name"
                  />
                </label>
                <label>
                  <span>Phone</span>
                  <input
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        phone: event.target.value
                      }))
                    }
                    placeholder="555-0100"
                  />
                </label>
                <button type="submit" disabled={pendingAction === "profile"}>
                  {pendingAction === "profile" ? "Saving" : "Save Profile"}
                </button>
              </form>
            </section>

            <section className="panel account-addresses" aria-label="Saved addresses">
              <div className="panel-heading">
                <h2>Saved Addresses</h2>
                <button
                  className="secondary"
                  type="button"
                  disabled={pendingAction === "addresses"}
                  onClick={() => void refreshAddresses()}
                >
                  {pendingAction === "addresses" ? "Refreshing" : "Refresh"}
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="empty-state compact">No saved addresses</div>
              ) : (
                <div className="address-card-list">
                  {addresses.map((address) => (
                    <article key={address.id} className="address-card">
                      <div>
                        <strong>{address.label ?? address.recipientName}</strong>
                        <span>{address.recipientName}</span>
                        <span>{address.line1}</span>
                        {address.line2 ? <span>{address.line2}</span> : null}
                        <span>
                          {[address.city, address.state, address.postalCode]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                        <span>{address.country}</span>
                      </div>
                      <div className="status-row">
                        {address.isDefaultShipping ? <span className="pill paid">Shipping</span> : null}
                        {address.isDefaultBilling ? <span className="pill authorized">Billing</span> : null}
                      </div>
                      <div className="address-actions">
                        <button
                          className="secondary"
                          type="button"
                          disabled={address.isDefaultShipping || pendingAction === `shipping-${address.id}`}
                          onClick={() => void setDefaultAddress(address.id, "shipping")}
                        >
                          Default Shipping
                        </button>
                        <button
                          className="secondary"
                          type="button"
                          disabled={address.isDefaultBilling || pendingAction === `billing-${address.id}`}
                          onClick={() => void setDefaultAddress(address.id, "billing")}
                        >
                          Default Billing
                        </button>
                        <button
                          className="secondary"
                          type="button"
                          disabled={pendingAction === `delete-${address.id}`}
                          onClick={() => void removeAddress(address.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <form className="checkout-form" onSubmit={handleAddressSubmit}>
                <div className="form-grid">
                  <label>
                    <span>Label</span>
                    <input
                      value={addressForm.label ?? ""}
                      onChange={(event) => updateAddressForm("label", event.target.value)}
                      placeholder="Home"
                    />
                  </label>
                  <label>
                    <span>Name</span>
                    <input
                      value={addressForm.recipientName}
                      onChange={(event) => updateAddressForm("recipientName", event.target.value)}
                      required
                    />
                  </label>
                </div>
                <label>
                  <span>Address</span>
                  <input
                    value={addressForm.line1}
                    onChange={(event) => updateAddressForm("line1", event.target.value)}
                    required
                  />
                </label>
                <div className="form-grid thirds">
                  <label>
                    <span>City</span>
                    <input
                      value={addressForm.city}
                      onChange={(event) => updateAddressForm("city", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    <span>State</span>
                    <input
                      value={addressForm.state ?? ""}
                      onChange={(event) => updateAddressForm("state", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Postal</span>
                    <input
                      value={addressForm.postalCode}
                      onChange={(event) => updateAddressForm("postalCode", event.target.value)}
                      required
                    />
                  </label>
                </div>
                <div className="form-grid">
                  <label>
                    <span>Country</span>
                    <input
                      value={addressForm.country}
                      maxLength={2}
                      onChange={(event) => updateAddressForm("country", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input
                      value={addressForm.phone ?? ""}
                      onChange={(event) => updateAddressForm("phone", event.target.value)}
                    />
                  </label>
                </div>
                <div className="auth-actions">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={Boolean(addressForm.isDefaultShipping)}
                      onChange={(event) => updateAddressForm("isDefaultShipping", event.target.checked)}
                    />
                    <span>Default shipping</span>
                  </label>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={Boolean(addressForm.isDefaultBilling)}
                      onChange={(event) => updateAddressForm("isDefaultBilling", event.target.checked)}
                    />
                    <span>Default billing</span>
                  </label>
                </div>
                <button type="submit" disabled={pendingAction === "address-create"}>
                  {pendingAction === "address-create" ? "Saving" : "Save Address"}
                </button>
              </form>
            </section>

          </section>
        </>
      ) : null}
    </main>
  );
}
