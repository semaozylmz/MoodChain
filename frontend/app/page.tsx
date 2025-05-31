"use client";

import React, { useState, useEffect } from "react";
import freighterApi from "@stellar/freighter-api";

const moods = ["Mutlu", "Üzgün", "Motive", "Sakin", "Heyecanlı"];

export default function HomePage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (await freighterApi.isConnected()) {
        const { address } = await freighterApi.getAddress();
        setPublicKey(address);
      }
    };
    checkConnection();
  }, []);

  const connectWallet = async () => {
    try {
      await freighterApi.setAllowed();
      const { address } = await freighterApi.getAddress();
      setPublicKey(address);
    } catch (e) {
      console.error("Bağlantı hatası:", e);
    }
  };

  const submitMood = async () => {
    if (!selectedMood) return alert("Lütfen bir mod seçin.");

    console.log("Mood gönderiliyor:", {
      mood: selectedMood,
      message,
      isAnonymous,
      wallet: publicKey,
    });

    // Burada akıllı sözleşme ile etkileşim kodu gelecek.
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-gray-900 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-4">🌤️ Stellar Mood Tracker</h1>

      {!publicKey ? (
        <button
          onClick={connectWallet}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Freighter Cüzdanını Bağla
        </button>
      ) : (
        <div>
          <p className="mb-4">Cüzdan: {publicKey}</p>

          <div className="mb-4">
            <label className="block mb-2">Bugünkü Modun:</label>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            >
              <option value="">Seçiniz...</option>
              {moods.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-2">Mesaj (isteğe bağlı):</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={() => setIsAnonymous(!isAnonymous)}
                className="mr-2"
              />
              Anonim gönder
            </label>
          </div>

          <button
            onClick={submitMood}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
          >
            Modumu Kaydet
          </button>
        </div>
      )}
    </div>
  );
}
