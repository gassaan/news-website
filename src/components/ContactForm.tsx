"use client";

import { useState } from "react";

const TOPICS = ["ޚަބަރެއް ދިނުން", "ޚިޔާލު ނުވަތަ ސުވާލު", "އިޝްތިހާރު", "ރަނގަޅުކުރަންޖެހޭ ކަމެއް", "އެހެނިހެން"];

// The site has no server, so sending opens the reader's email app (or WhatsApp) with the message filled in.
export default function ContactForm({ email, whatsapp }: { email: string; whatsapp: string }) {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");

  const text = `${message.trim()}\n\n— ${name.trim()}`;
  const subject = `Hulhangu: ${topic}`;

  function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  }

  function sendWhatsApp() {
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(`${topic}\n\n${text}`)}`, "_blank", "noopener");
  }

  const ready = name.trim() !== "" && message.trim() !== "";

  return (
    <form className="contact-form" onSubmit={sendEmail}>
      <h2>މެސެޖެއް ފޮނުއްވާ</h2>
      <label>
        <span>ނަން</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ތިބާގެ ނަން" required />
      </label>
      <div className="topics" role="radiogroup" aria-label="މައުޟޫއު">
        {TOPICS.map((t) => (
          <button
            type="button"
            key={t}
            role="radio"
            aria-checked={topic === t}
            className={topic === t ? "on" : undefined}
            onClick={() => setTopic(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <label>
        <span>މެސެޖު</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="ތިބާ ބުނަން ބޭނުންވާ ވާހަކަ މިތަނުގައި ލިޔުއްވާ..."
          rows={6}
          required
        />
      </label>
      <div className="send-row">
        {email && (
          <button className="btn-solid" type="submit" disabled={!ready}>
            އީމެއިލް ކޮށްލާ
          </button>
        )}
        {whatsapp && (
          <button className="btn-wa" type="button" disabled={!ready} onClick={sendWhatsApp}>
            ވަޓްސްއެޕް ކޮށްލާ
          </button>
        )}
      </div>
    </form>
  );
}
