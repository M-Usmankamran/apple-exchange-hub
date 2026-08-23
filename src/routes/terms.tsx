import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — AppleHub Marketplace" },
      {
        name: "description",
        content:
          "Terms for buyers and sellers on AppleHub: account security, purchases, bulk discounts, selling and exchange rules, custom orders and dispute resolution.",
      },
      { property: "og:title", content: "AppleHub Terms & Conditions" },
      {
        property: "og:description",
        content:
          "Read the rules for buying, selling, exchanging and customizing Apple products on AppleHub.",
      },
    ],
  }),
  component: Terms,
});

const sections = [
  {
    title: "1. Account & Security",
    blocks: [
      {
        heading: "Account responsibility",
        text: "Users are responsible for maintaining the confidentiality and security of their account credentials. Any activity conducted through a user's account is the legal responsibility of the account holder.",
      },
      {
        heading: "Accurate information",
        text: "Users must provide accurate location data, contact details, payment information and product information. This is required for smooth delivery, pickup, payments and local vendor discovery.",
      },
    ],
  },
  {
    title: "2. Purchasing Apple Products",
    blocks: [
      {
        heading: "Local vendor listings",
        text: "Products are sold by verified independent vendors. Prices, stock availability, warranties and shop pickup options are managed directly by each vendor.",
      },
      {
        heading: "Bulk order discount",
        text: "Bulk pricing or special discounts may apply when a user purchases six (6) or more units of the same product model from a single vendor.",
      },
      {
        heading: "Online payment",
        text: "Secure online transactions are processed through encrypted payment gateways. IMPORTANT DISCLAIMER: If a user chooses to pay online, the platform will not be responsible for any loss, financial damage, payment dispute or issue arising from the transaction, except where responsibility is required by applicable law. Verify the vendor, product details and order information before paying online.",
      },
      {
        heading: "In-store pickup",
        text: "For in-store pickup, payment is completed at the vendor's physical store. Inspect the product before paying and collecting. The vendor is responsible for providing the agreed product and documentation.",
      },
    ],
  },
  {
    title: "3. Selling & Exchanging Your Device",
    blocks: [
      {
        heading: "Ownership & legality",
        text: "Users must be the sole and legal owner of any device listed for sale or exchange.",
      },
      {
        heading: "Strict ban on stolen or blocked devices",
        text: "Stolen devices, iCloud-locked or Find My locked devices, fraudulently obtained devices, PTA non-compliant or blocked devices, and devices violating regional regulations are strictly prohibited. The platform and vendors may reject any suspicious device.",
      },
      {
        heading: "Accurate condition reporting",
        text: "Users must accurately state model, physical condition, battery health, storage capacity, damage or repairs, accessories, original box and original cable or charger.",
      },
      {
        heading: "Price finalization and physical inspection",
        text: "Online bids are estimated quotations. The final price is confirmed only after physical inspection by an authorised vendor rider at the user's location or at the vendor's shop. If the actual condition differs from the information provided, the vendor may adjust the offer, renegotiate or withdraw it.",
      },
      {
        heading: "Data privacy and device reset",
        text: "Before handing over a device, the user is solely responsible for backing up data, removing their iCloud account and Apple ID, disabling Find My and performing a factory reset. The platform and vendor are not responsible for personal data left on a sold or exchanged device.",
      },
    ],
  },
  {
    title: "4. Interactive Customizer & Custom Orders",
    blocks: [
      {
        heading: "Final sale on custom items",
        text: "Personalized cases, custom skins, printed covers and personalized accessories are made to the user's design and are generally non-refundable and non-returnable, unless delivered damaged, defective or different from the approved order details.",
      },
      {
        heading: "Colour & design variations",
        text: "The live preview is a digital visual guide. Minor colour, printing, material and alignment variations may occur between the preview and the physical product.",
      },
      {
        heading: "Prohibited custom content",
        text: "Designs may not contain copyrighted images or trademarked logos without permission, explicit or illegal material, hate speech, harassment or abusive content. The platform may reject or remove prohibited designs.",
      },
    ],
  },
  {
    title: "5. Dispute Resolution & Platform Role",
    blocks: [
      {
        heading: "Intermediary status",
        text: "The platform is a secure digital marketplace connecting users with verified vendors. It may assist with communication, offers, order workflows and dispute escalation, but is not the manufacturer or direct seller of vendor products unless explicitly stated.",
      },
      {
        heading: "Dispute escalation",
        text: "Disagreements about phone condition, trade-in pricing, product information, orders or vendor communication may be escalated to Admin Support for review and possible mediation.",
      },
    ],
  },
  {
    title: "6. Vendor and User Communication",
    blocks: [
      {
        heading: "Use the secure messaging system",
        text: "Communication about buying, selling and exchanging should take place through the platform's secure messaging. Users and vendors must not commit fraud, mislead others, send spam, share harmful content, scam users or sell illegal products. Admin may investigate reported communications and act on violations.",
      },
    ],
  },
  {
    title: "7. Platform Security and Fraud Prevention",
    blocks: [
      {
        heading: "Protective measures",
        text: "The platform implements measures against unauthorized access, fraud, suspicious transactions, fake accounts, data theft and common cyberattacks, and may suspend, investigate or permanently terminate accounts involved in suspicious or fraudulent activity.",
      },
    ],
  },
  {
    title: "8. Acceptance of Terms",
    blocks: [
      {
        heading: "Your agreement",
        text: "By registering, buying, selling, exchanging, customizing products or using any service on the platform, users agree to comply with these Terms & Conditions. Acceptance is confirmed before creating an account, completing a purchase, selling a device, requesting an exchange or ordering a customized product.",
      },
    ],
  },
];

function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold sm:text-4xl">Terms &amp; Conditions</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        For users and buyers of the AppleHub marketplace. Last updated{" "}
        {new Date().toLocaleDateString("en-GB", { dateStyle: "long" })}.
      </p>

      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-bold">{s.title}</h2>
            <div className="mt-4 space-y-5">
              {s.blocks.map((b) => (
                <div key={b.heading} className="rounded-2xl border bg-card p-5 shadow-soft">
                  <h3 className="text-sm font-semibold">{b.heading}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 rounded-2xl surface-tint p-5 text-sm text-muted-foreground">
        A mandatory acceptance checkbox appears at registration, checkout, sell, exchange and
        custom order flows: “I have read, understood, and agree to the Terms &amp;
        Conditions.”
      </p>
    </div>
  );
}
