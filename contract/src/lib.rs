#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, log, symbol_short, Address, Env, Symbol, Vec,
};

#[contract]
pub struct MoodContract;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    MoodLog(Address),
    MoodHistoryEntry(Address, u64), 
    GlobalMoodCount,
    MoodStats(Symbol),
    UserMoodCount(Address),
}

#[derive(Clone)]
#[contracttype]
pub struct MoodEntry {
    pub mood: Symbol,
    pub message: Symbol,
    pub is_anonymous: bool,
    pub timestamp: u64,
    pub entry_id: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct MoodStats {
    pub mood_type: Symbol,
    pub count: u64,
    pub last_updated: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct GlobalStats {
    pub total_moods: u64,
    pub unique_users: u64,
    pub most_popular_mood: Symbol,
    pub last_updated: u64,
}

#[contractimpl]
impl MoodContract {
    pub fn log_mood(
        env: Env,
        user: Address,
        mood: Symbol,
        message: Symbol,
        is_anonymous: bool,
    ) -> u64 {
        user.require_auth();
        let timestamp = env.ledger().timestamp();

        let global_count = Self::get_global_mood_count(env.clone()) + 1;
        env.storage().persistent().set(&DataKey::GlobalMoodCount, &global_count);

        let user_count = Self::get_user_mood_count(env.clone(), user.clone()) + 1;
        env.storage().persistent().set(&DataKey::UserMoodCount(user.clone()), &user_count);

        let entry = MoodEntry {
            mood: mood.clone(),
            message,
            is_anonymous,
            timestamp,
            entry_id: global_count,
        };

        env.storage().persistent().set(&DataKey::MoodLog(user.clone()), &entry);

        // Mood geçmişini ayrı key'lerle sakla
        let index = user_count - 1;
        env.storage()
            .persistent()
            .set(&DataKey::MoodHistoryEntry(user.clone(), index), &entry);

        Self::update_mood_stats(env.clone(), mood.clone());

        log!(
            &env,
            "Mood logged: user={}, mood={}, entry_id={}",
            user,
            mood,
            global_count
        );

        global_count
    }

    pub fn get_mood(env: Env, user: Address) -> Option<MoodEntry> {
        env.storage().persistent().get(&DataKey::MoodLog(user))
    }

    pub fn get_mood_history(env: Env, user: Address) -> Vec<MoodEntry> {
        let mut history = Vec::new(&env);
        let count = Self::get_user_mood_count(env.clone(), user.clone());
        let start = if count > 10 { count - 10 } else { 0 };

        for i in start..count {
            if let Some(entry) = env
                .storage()
                .persistent()
                .get::<DataKey, MoodEntry>(&DataKey::MoodHistoryEntry(user.clone(), i))
            {
                history.push_back(entry);
            }
        }

        history
    }

    pub fn get_mood_stats(env: Env, mood: Symbol) -> Option<MoodStats> {
        env.storage()
            .persistent()
            .get(&DataKey::MoodStats(mood))
    }

    pub fn get_global_stats(env: Env) -> GlobalStats {
        let total_moods = Self::get_global_mood_count(env.clone());
        let timestamp = env.ledger().timestamp();

        let moods = [
            symbol_short!("Mutlu"),
            symbol_short!("Uzgun"),
            symbol_short!("Motive"),
            symbol_short!("Sakin"),
            symbol_short!("Heyecan"),
        ];

        let mut most_popular = symbol_short!("Mutlu");
        let mut max_count = 0u64;

        for mood in moods.iter() {
            if let Some(stats) = Self::get_mood_stats(env.clone(), mood.clone()) {
                if stats.count > max_count {
                    max_count = stats.count;
                    most_popular = mood.clone();
                }
            }
        }

        GlobalStats {
            total_moods,
            unique_users: 0,
            most_popular_mood: most_popular,
            last_updated: timestamp,
        }
    }

    pub fn get_user_mood_count(env: Env, user: Address) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::UserMoodCount(user))
            .unwrap_or(0)
    }

    pub fn get_global_mood_count(env: Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::GlobalMoodCount)
            .unwrap_or(0)
    }

    fn update_mood_stats(env: Env, mood: Symbol) {
        let timestamp = env.ledger().timestamp();

        let stats = if let Some(mut existing_stats) = env
            .storage()
            .persistent()
            .get::<DataKey, MoodStats>(&DataKey::MoodStats(mood.clone()))
        {
            existing_stats.count += 1;
            existing_stats.last_updated = timestamp;
            existing_stats
        } else {
            MoodStats {
                mood_type: mood.clone(),
                count: 1,
                last_updated: timestamp,
            }
        };

        env.storage()
            .persistent()
            .set(&DataKey::MoodStats(mood), &stats);
    }

    pub fn delete_user_data(env: Env, user: Address) {
        user.require_auth();
        env.storage()
            .persistent()
            .remove(&DataKey::MoodLog(user.clone()));

        let count = Self::get_user_mood_count(env.clone(), user.clone());
        for i in 0..count {
            env.storage()
                .persistent()
                .remove(&DataKey::MoodHistoryEntry(user.clone(), i));
        }

        env.storage()
            .persistent()
            .remove(&DataKey::UserMoodCount(user.clone()));

        log!(&env, "User data deleted: {}", user);
    }

    pub fn get_version() -> Symbol {
        symbol_short!("v1_0_0")
    }

    pub fn health_check(env: Env) -> bool {
    Self::get_global_mood_count(env) > 0
    }

}
