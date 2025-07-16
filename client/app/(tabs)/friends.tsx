import React, { useState, useContext, useEffect } from 'react'
import { 
  StyleSheet, 
  Text, 
  SafeAreaView, 
  View, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  TextInput, 
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AuthContext } from '../context/authContext'

// Types
interface Friend {
  id: string
  username: string
  avatar_url: string
  level: number
  total_xp: number
  status: 'online' | 'offline'
  last_active?: string
}

interface SearchResult {
  id: string
  username: string
  avatar_url: string
  level: number
  total_xp: number
  is_friend: boolean
}
interface PendingRequest {
  request_id: string
  requester_id: string
  requester_username: string
  requester_avatar: string | null
  requested_at: string
}

const Friends = () => {
  const { token } = useContext(AuthContext)
  const queryClient = useQueryClient()
  const [view, setView] = useState<'friends' | 'requests'>('friends')

  // Base URL (adjust if running on Android emulator)
  const BASE = 'http://localhost:8000'

  // Fetch accepted friends
  const { data: friends = [], isLoading: loadingFriends } = useQuery<Friend[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch friends')
      return res.json()
    },
  })

  // Fetch incoming friend requests
  const { data: pending = [], isLoading: loadingPending } = useQuery<PendingRequest[]>({
    queryKey: ['pending'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/friend_requests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch pending requests')
      return res.json()
    },
  })

  // Search modal state
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Clear search when modal closes
  useEffect(() => {
    if (!searchModalVisible) {
      setSearchQuery('')
      setSearchResults([])
    }
  }, [searchModalVisible])

  // Send friend request mutation
  const sendRequest = useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch('http://localhost:8000/friend-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipient_username: username })
      })
      if (!res.ok) throw new Error('Request failed')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      queryClient.invalidateQueries({ queryKey: ['userSearch', searchQuery] })
    }
  })

  // Perform username search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(`http://localhost:8000/search?search=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Search failed')
      const data: SearchResult[] = await res.json()
      setSearchResults(data)
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const FriendCard = ({ friend }: { friend: Friend }) => (
    <View style={styles.friendCard}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: friend.avatar_url }} style={styles.avatar} />
          <View style={[
            styles.statusIndicator, 
            friend.status === 'online' ? styles.statusOnline : styles.statusOffline
          ]} />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{friend.username}</Text>
          <Text style={styles.friendLevel}>Level {friend.level}</Text>
          <Text style={styles.friendXp}>{friend.total_xp.toLocaleString()} XP</Text>
        </View>
      </View>
      <View style={styles.friendActions}>
        <Text style={styles.friendStatus}>
          {friend.status === 'online' ? 'Online' : friend.last_active || 'Offline'}
        </Text>
        <TouchableOpacity style={styles.messageButton}>
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const SearchResultCard = ({ result }: { result: SearchResult }) => (
    <View style={styles.searchResultCard}>
      <View style={styles.searchResultInfo}>
        <Image source={{ uri: result.avatar_url }} style={styles.searchAvatar} />
        <View style={styles.searchDetails}>
          <Text style={styles.searchName}>{result.username}</Text>
          <Text style={styles.searchLevel}>Level {result.level} • {result.total_xp.toLocaleString()} XP</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[
          styles.addButton, 
          result.is_friend && styles.addButtonDisabled
        ]}
        disabled={result.is_friend}
        onPress={() => sendRequest.mutate(result.username)}
      >
        <Text style={[
          styles.addButtonText,
          result.is_friend && styles.addButtonTextDisabled
        ]}>
          {result.is_friend ? 'Friends' : 'Add'}
        </Text>
      </TouchableOpacity>
    </View>
  )

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No friends yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Add friends to compare progress and stay motivated together
      </Text>
      <TouchableOpacity 
        style={styles.addFirstFriendButton}
        onPress={() => setSearchModalVisible(true)}
      >
        <Text style={styles.addFirstFriendText}>Find Friends</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setSearchModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Friends List */}
      <View style={styles.content}>
        {loadingFriends ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : friends.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Your Friends</Text>
            <Text style={styles.sectionSubtitle}>
              {friends.length} friend{friends.length !== 1 ? 's' : ''} • {friends.filter(f => f.status === 'online').length} online
            </Text>
            <FlatList
              data={friends}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <FriendCard friend={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </View>

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setSearchModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Friends</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Search Input */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username"
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={isSearching}
              >
                {isSearching
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.searchButtonText}>Search</Text>
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Results */}
          <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
            {searchResults.length > 0 ? (
              <View style={styles.resultsSection}>
                <Text style={styles.resultsTitle}>Search Results</Text>
                {searchResults.map(r => <SearchResultCard key={r.id} result={r} />)}
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

export default Friends

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32, paddingTop: 20, paddingBottom: 32 },
  headerTitle: { fontSize: 28, fontWeight: '300', color: '#1a1a1a', letterSpacing: -0.5 },
  addButton: { backgroundColor: '#1a1a1a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 32 },
  sectionTitle: { fontSize: 24, fontWeight: '400', color: '#1a1a1a', marginBottom: 8, letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 16, color: '#64748b', marginBottom: 24, fontWeight: '400' },
  listContent: { paddingBottom: 40 },
  friendCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  friendInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  statusIndicator: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#ffffff' },
  statusOnline: { backgroundColor: '#10b981' },
  statusOffline: { backgroundColor: '#94a3b8' },
  friendDetails: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: '500', color: '#1a1a1a', marginBottom: 2, letterSpacing: -0.1 },
  friendLevel: { fontSize: 14, color: '#64748b', marginBottom: 2, fontWeight: '400' },
  friendXp: { fontSize: 12, color: '#94a3b8', fontWeight: '400' },
  friendActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  friendStatus: { fontSize: 12, color: '#64748b', fontWeight: '400' },
  messageButton: { backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  messageButtonText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyStateTitle: { fontSize: 24, fontWeight: '400', color: '#1a1a1a', marginBottom: 12, letterSpacing: -0.3 },
  emptyStateSubtitle: { font_size: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32, fontWeight: '400' },
  addFirstFriendButton: { backgroundColor: '#1a1a1a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addFirstFriendText: { color: '#ffffff', fontSize: 16, fontWeight: '500' },
  modalContainer: { flex: 1, backgroundColor: '#fafafa' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32, paddingTop: 20, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cancelButton: { paddingVertical: 8 },
  cancelButtonText: { fontSize: 16, color: '#64748b', fontWeight: '400' },
  modalTitle: { fontSize: 18, fontWeight: '500', color: '#1a1a1a', letterSpacing: -0.2 },
  headerSpacer: { width: 60 },
  searchSection: { paddingHorizontal: 32, paddingVertical: 24 },
  searchContainer: { flexDirection: 'row', gap: 12 },
  searchInput: { flex: 1, backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb' },
  searchButton: { backgroundColor: '#1a1a1a', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, justifyContent: 'center' },
  searchButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
  searchResults: { flex: 1 },
  resultsSection: { paddingHorizontal: 32 },
  resultsTitle: { fontSize: 18, fontWeight: '500', color: '#1a1a1a', marginBottom: 16, letterSpacing: -0.2 },
  searchResultCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  searchResultInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  searchAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  searchDetails: { flex: 1 },
  searchName: { fontSize: 16, fontWeight: '500', color: '#1a1a1a', marginBottom: 2, letterSpacing: -0.1 },
  searchLevel: { fontSize: 14, color: '#64748b', fontWeight: '400' },
  addButtonDisabled: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  addButtonTextDisabled: { color: '#94a3b8' },
  noResults: { alignItems: 'center', paddingVertical: 40 },
  noResultsText: { fontSize: 16, fontWeight: '500', color: '#64748b', marginBottom: 8 },
  noResultsSubtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
})
