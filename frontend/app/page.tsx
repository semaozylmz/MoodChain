"use client";

import React, { useState, useEffect } from "react";
import freighterApi from "@stellar/freighter-api";
import {
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Account,
  Operation,
  Memo,
  Address,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";

const moods = ["Mutlu", "Uzgun", "Motive", "Sakin", "Heyecanlı"];
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";
const RPC_URL = "https://soroban-testnet.stellar.org";

interface MoodEntry {
  mood: string;
  message: string;
  is_anonymous: boolean;
  timestamp: number;
  entry_id: number;
}

interface GlobalStats {
  total_moods: number;
  most_popular_mood: string;
  last_updated: number;
}

export default function HomePage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastMood, setLastMood] = useState<MoodEntry | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [userMoodCount, setUserMoodCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"current" | "history" | "stats">("current");

  // Cüzdan bağlantısını kontrol et
  useEffect(() => {
    const checkConnection = async () => {
      if (await freighterApi.isConnected()) {
        const { address } = await freighterApi.getAddress();
        setPublicKey(address);
        await loadUserData(address);
        await loadGlobalStats();
      }
    };
    checkConnection();
  }, []);

  // Cüzdan bağla butonu için
  const connectWallet = async () => {
    try {
      await freighterApi.setAllowed();
      const { address } = await freighterApi.getAddress();
      setPublicKey(address);
      await loadUserData(address);
      await loadGlobalStats();
    } catch (e) {
      console.error("Bağlantı hatası:", e);
      alert("Cüzdan bağlanamadı.");
    }
  };

  // Kullanıcı verilerini yükle
  const loadUserData = async (address: string) => {
    try {
      const lastMoodEntry = await callContract("get_mood", [Address.fromString(address)]);
      setLastMood(lastMoodEntry ?? null);

      const historyEntries = await callContract("get_mood_history", [Address.fromString(address)]);
      setMoodHistory(historyEntries ?? []);

      const count = await callContract("get_user_mood_count", [Address.fromString(address)]);
      setUserMoodCount(count ?? 0);
    } catch (error) {
      console.error("Kullanıcı verisi yüklenirken hata:", error);
    }
  };

  // Genel istatistikleri yükle
  const loadGlobalStats = async () => {
    try {
      const stats = await callContract("get_global_stats", []);
      setGlobalStats(stats);
    } catch (error) {
      console.error("Genel istatistikler yüklenirken hata:", error);
    }
  };

  // Manuel fetch ile Soroban RPC contract çağrısı (read-only)
  const callContract = async (funcName: string, args: any[]) => {
    try {
      const scArgs = args.map((arg) => nativeToScVal(arg));
      const params = {
        contractId: CONTRACT_ADDRESS,
        method: funcName,
        args: scArgs,
        networkPassphrase: Networks.TESTNET,
      };

      const body = {
        jsonrpc: "2.0",
        id: 1,
        method: "simulateTransaction",
        params: [
          {
            ...params,
          },
        ],
      };

      const response = await fetch(`${RPC_URL}/rpc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error("RPC çağrısı başarısız:", response.statusText);
        return null;
      }

      const json = await response.json();

      if (json.error) {
        console.error("RPC hata:", json.error);
        return null;
      }

      const returnValue = json.result?.returnValue;
      if (!returnValue) return null;

      return scValToNative(returnValue);
    } catch (error) {
      console.error("callContract hata:", error);
      return null;
    }
  };

  // Ruh hali gönderme fonksiyonu (işlem oluşturma, imzalama, gönderme)

const submitMood = async () => {
  if (!publicKey) return alert("Lütfen cüzdanınızı bağlayınız.");
  if (!selectedMood) return alert("Lütfen bir ruh hali seçiniz.");

  setIsSubmitting(true);

  try {
    const accountResponse = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
    if (!accountResponse.ok) throw new Error("Hesap yüklenemedi");
    const accountData = await accountResponse.json();

    const sourceAccount = new Account(publicKey, accountData.sequence);

    const txBuilder = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    });

    txBuilder.addMemo(Memo.text(`Mood: ${selectedMood}`));

    const tx = txBuilder.setTimeout(30).build();

    // Burada imzalama sonucu obje geliyor
    const signResult = await freighterApi.signTransaction(tx.toXDR(), {
      networkPassphrase: Networks.TESTNET,
    });

    // signedTxXdr stringini alıyoruz
    const signedTxXdr = signResult.signedTxXdr;

    // İmzalanan işlemi Horizon'a gönderiyoruz
    const response = await fetch("https://horizon-testnet.stellar.org/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `tx=${encodeURIComponent(signedTxXdr)}`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`İşlem gönderilemedi: ${errorText}`);
    }

    alert("Ruh haliniz başarıyla kaydedildi!");

    await loadUserData(publicKey);
    await loadGlobalStats();
    setSelectedMood("");
    setMessage("");
  } catch (error: any) {
    console.error("İşlem hatası:", error);
    alert("Bir hata oluştu: " + error.message);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mood Diary</h1>

      {!publicKey ? (
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Cüzdanı Bağla
        </button>
      ) : (
        <>
          <div className="mb-4">
            <button
              className={`mr-2 ${activeTab === "current" ? "font-bold" : ""}`}
              onClick={() => setActiveTab("current")}
            >
              Son Ruh Hali
            </button>
            <button
              className={`mr-2 ${activeTab === "history" ? "font-bold" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              Geçmiş
            </button>
            <button
              className={`${activeTab === "stats" ? "font-bold" : ""}`}
              onClick={() => setActiveTab("stats")}
            >
              İstatistikler
            </button>
          </div>

          {activeTab === "current" && (
            <section>
              <h2>Ruh Halinizi Seçin</h2>
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="border p-2 rounded mb-2 w-full"
              >
                <option value="">-- Seçiniz --</option>
                {moods.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="İsterseniz bir mesaj bırakın..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border p-2 rounded mb-2 w-full"
                rows={3}
              />
              <label className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mr-2"
                />
                Anonim olarak kaydet
              </label>
              <button
                onClick={submitMood}
                disabled={isSubmitting}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                {isSubmitting ? "Gönderiliyor..." : "Gönder"}
              </button>

              {lastMood && (
                <div className="mt-6 p-4 border rounded">
                  <h3>Son Kaydedilen Ruh Haliniz</h3>
                  <p>
                    <strong>Ruh hali:</strong> {lastMood.mood}
                  </p>
                  <p>
                    <strong>Mesaj:</strong> {lastMood.message}
                  </p>
                  <p>
                    <strong>Tarih:</strong>{" "}
                    {new Date(lastMood.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              )}
            </section>
          )}

          {activeTab === "history" && (
            <section>
              <h2>Ruh Hali Geçmişiniz</h2>
              {moodHistory.length === 0 ? (
                <p>Henüz ruh hali kaydınız yok.</p>
              ) : (
                <ul>
                  {moodHistory.map((entry) => (
                    <li key={entry.entry_id} className="mb-2 p-2 border rounded">
                      <p>
                        <strong>Ruh hali:</strong> {entry.mood}
                      </p>
                      <p>
                        <strong>Mesaj:</strong> {entry.message}
                      </p>
                      <p>
                        <strong>Tarih:</strong>{" "}
                        {new Date(entry.timestamp * 1000).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {activeTab === "stats" && (
            <section>
              <h2>Genel İstatistikler</h2>
              {globalStats ? (
                <>
                  <p>
                    <strong>Toplam ruh hali sayısı:</strong>{" "}
                    {globalStats.total_moods}
                  </p>
                  <p>
                    <strong>En popüler ruh hali:</strong>{" "}
                    {globalStats.most_popular_mood}
                  </p>
                  <p>
                    <strong>Son güncelleme:</strong>{" "}
                    {new Date(globalStats.last_updated * 1000).toLocaleString()}
                  </p>
                </>
              ) : (
                <p>İstatistikler yükleniyor...</p>
              )}
              <p>
                <strong>Kullanıcı ruh hali sayısı:</strong> {userMoodCount}
              </p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
