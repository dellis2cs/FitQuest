// app/(tabs)/profile.tsx
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/authContext';

// Updated Stat interface matches backend response
interface Stat {
  title: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
  percentComplete: number;
  icon: string;
}
interface UserData {
  username: string;
  total_xp: number;
  current_level: number;
  stats: Stat[];                // backend-provided array
  bench_1rm: number;
  squat_1rm: number;
  deadlift_1rm: number;
  avatar_url: string;
}

const StatCard: React.FC<{ stat: Stat }> = ({ stat }) => {
  // use percentComplete for width
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={styles.statIconContainer}>
          <Text style={styles.statIcon}>{stat.icon}</Text>
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statTitle}>{stat.title}</Text>
          <Text style={styles.statLevel}>Level {stat.level}</Text>
        </View>
        <View style={styles.statXpContainer}>
          <Text style={styles.statXpValue}>{Math.floor(stat.currentXp)}</Text>
          <Text style={styles.statXpMax}>/{Math.floor(stat.nextLevelXp)} XP</Text>
        </View>
      </View>
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressFill,
            { width: `${stat.percentComplete}%` }
          ]}
        />
      </View>
      <Text style={styles.percentText}>
        {stat.percentComplete.toFixed(0)}% to next level
      </Text>
    </View>
  );
};

export default function ProfileScreen() {
  const { signOut, token } = useContext(AuthContext);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('http://localhost:8000/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          // token invalid, sign out
          await signOut();
          router.replace('/');
          return;
        }
        const data: UserData = await res.json();
        setUserData(data);
      } catch (e) {
        console.error('Fetch profile error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [token]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile.</Text>
      </View>
    );
  }

  const {
    username,
    total_xp,
    current_level,
    stats,
    bench_1rm,
    squat_1rm,
    deadlift_1rm,
    avatar_url,
  } = userData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.headerButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: avatar_url }} style={styles.avatar} />
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{current_level}</Text>
                </View>
              </View>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.totalXp}>{total_xp.toLocaleString()} Total XP</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          {stats.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </View>

        {/* Personal Records */}
        <View style={styles.prSection}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
          <View style={styles.prCard}>
            <View style={styles.prGrid}>
              {[
                { label: 'Bench', value: bench_1rm },
                { label: 'Squat', value: squat_1rm },
                { label: 'Deadlift', value: deadlift_1rm },
              ].map((pr) => (
                <React.Fragment key={pr.label}>
                  <View style={styles.prItem}>
                    <Text style={styles.prLabel}>{pr.label}</Text>
                    <Text style={styles.prValue}>{pr.value}</Text>
                    <Text style={styles.prUnit}>lbs</Text>
                  </View>
                  {pr.label !== 'Deadlift' && <View style={styles.prDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Sign Out Modal */}
      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.signOutButton]}
                onPress={async () => {
                  setModalVisible(false);
                  await signOut();
                  router.replace('/');
                }}
              >
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  headerButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  headerButtonText: { fontSize: 18, color: '#000' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#000' },
  profileSection: { marginHorizontal: 24, marginBottom: 32 },
  profileCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: '#f9fafb' },
  profileContent: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 24 },
  avatar: { width:96, height:96, borderRadius:48 },
  levelBadge: { position:'absolute', bottom:-8, right:-8, width:32, height:32, backgroundColor:'#288afa', borderRadius:16, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'#fff' },
  levelBadgeText:{ fontSize:12, fontWeight:'bold', color:'#fff' },
  username:{ fontSize:24, fontWeight:'bold', color:'#000', marginBottom:8 },
  totalXp:{ fontSize:16, color:'#6b7280', marginBottom:24 },
  statsSection:{ paddingHorizontal:24, marginBottom:32 },
  sectionTitle:{ fontSize:20, fontWeight:'600', color:'#000', marginBottom:24 },
  statCard:{ backgroundColor:'#fff', borderRadius:16, padding:20, marginBottom:16, shadowColor:'#000', shadowOffset:{ width:0, height:1 }, shadowOpacity:0.05, shadowRadius:2, elevation:2, borderWidth:1, borderColor:'#f9fafb' },
  statHeader:{ flexDirection:'row', alignItems:'center', marginBottom:16 },
  statIconContainer:{ width:48, height:48, borderRadius:12, backgroundColor:'#f9fafb', alignItems:'center', justifyContent:'center', marginRight:16 },
  statIcon:{ fontSize:20 },
  statInfo:{ flex:1 },
  statTitle:{ fontSize:18, fontWeight:'600', color:'#000' },
  statLevel:{ fontSize:14, color:'#6b7280' },
  statXpContainer:{ alignItems:'flex-end' },
  statXpValue:{ fontSize:18, fontWeight:'bold', color:'#000' },
  statXpMax:{ fontSize:12, color:'#9ca3af' },
  progressContainer:{ width:'100%', height:8, backgroundColor:'#f3f4f6', borderRadius:4 },
  progressFill:{ height:'100%', backgroundColor:'#288afa', borderRadius:4 },
  percentText:{ marginTop:4, fontSize:12, color:'#888', alignSelf:'flex-end' },
  prSection:{ paddingHorizontal:24, marginBottom:32 },
  prCard:{ backgroundColor:'#fff', borderRadius:16, padding:24, shadowColor:'#000', shadowOffset:{ width:0, height:1 }, shadowOpacity:0.05, shadowRadius:2, elevation:2, borderWidth:1, borderColor:'#f9fafb' },
  prGrid:{ flexDirection:'row', justifyContent:'space-between' },
  prItem:{ alignItems:'center', flex:1 },
  prDivider:{ width:1, backgroundColor:'#f3f4f6', marginHorizontal:16 },
  prLabel:{ fontSize:14, color:'#6b7280', marginBottom:4 },
  prValue:{ fontSize:24, fontWeight:'bold', color:'#000' },
  prUnit:{ fontSize:12, color:'#9ca3af' },
  errorContainer:{ flex:1, justifyContent:'center', alignItems:'center' },
  errorText:{ fontSize:16, color:'red' },
  modalOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.3)', justifyContent:'center', alignItems:'center' },
  modalContent:{ width:'80%', backgroundColor:'#fff', borderRadius:16, padding:24, alignItems:'center', shadowColor:'#000', shadowOpacity:0.2, shadowRadius:4, elevation:5 },
  modalTitle:{ fontSize:18, fontWeight:'600', marginBottom:8 },
  modalMessage:{ fontSize:14, color:'#555', marginBottom:24, textAlign:'center' },
  modalButtons:{ flexDirection:'row', width:'100%', justifyContent:'space-between' },
  modalButton:{ flex:1, paddingVertical:12, borderRadius:8, alignItems:'center' },
  cancelButton:{ backgroundColor:'#eee', marginRight:8 },
  signOutButton:{ backgroundColor:'#e53935', marginLeft:8 },
  cancelText:{ color:'#333', fontWeight:'500' },
  signOutText:{ color:'#fff', fontWeight:'500' },
});
