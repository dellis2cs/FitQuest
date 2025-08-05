import React, { useContext, useState } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/authContext';

export interface Guild {
  id: string;
  name: string;
  description: string;
  member_count: number;
  level: number;
  xp: number;
  image_url?: string;
  is_member: boolean;
  created_at: string;
  category: string;
}

interface GuildStats {
  totalGuilds: number;
  joinedGuilds: number;
  totalXpEarned: number;
  averageGuildLevel: number;
  favoriteCategory: string;
}

interface PaginatedGuildsResponse {
  guilds: Guild[];
  total: number;
  hasMore: boolean;
}

const GuildCard: React.FC<{ guild: Guild; onPress: () => void }> = ({ guild, onPress }) => {
  return (
    <TouchableOpacity style={styles.guildCard} onPress={onPress}>
      <View style={styles.guildHeader}>
        <View style={styles.guildImageContainer}>
          {guild.image_url ? (
            <Image source={{ uri: guild.image_url }} style={styles.guildImage} />
          ) : (
            <View style={styles.guildImagePlaceholder}>
              <Text style={styles.guildImageText}>{guild.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.guildInfo}>
          <Text style={styles.guildName}>{guild.name}</Text>
          <Text style={styles.guildCategory}>{guild.category}</Text>
          <Text style={styles.guildDescription} numberOfLines={2}>
            {guild.description}
          </Text>
        </View>
        {guild.is_member && (
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>Joined</Text>
          </View>
        )}
      </View>
      
      <View style={styles.guildStats}>
        <View style={styles.guildStat}>
          <Text style={styles.guildStatLabel}>Members</Text>
          <Text style={styles.guildStatValue}>{guild.member_count.toLocaleString()}</Text>
        </View>
        <View style={styles.guildStatDivider} />
        <View style={styles.guildStat}>
          <Text style={styles.guildStatLabel}>Level</Text>
          <Text style={styles.guildStatValue}>{guild.level}</Text>
        </View>
        <View style={styles.guildStatDivider} />
        <View style={styles.guildStat}>
          <Text style={styles.guildStatLabel}>XP</Text>
          <Text style={styles.guildStatXp}>{Math.floor(guild.xp).toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CategoryFilter: React.FC<{ 
  categories: string[]; 
  selectedCategory: string; 
  onSelectCategory: (category: string) => void;
}> = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
      contentContainerStyle={styles.categoryFilterContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryButton,
            selectedCategory === category && styles.categoryButtonActive
          ]}
          onPress={() => onSelectCategory(category)}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category && styles.categoryButtonTextActive
          ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default function GuildsScreen() {
  const { token, signOut } = useContext(AuthContext);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Fitness', 'Gaming', 'Learning', 'Social', 'Creative', 'Professional'];

  // Fetch guild stats
  const { 
    data: guildStats, 
    isLoading: statsLoading,
    refetch: refetchStats 
  } = useQuery<GuildStats>({
    queryKey: ['guildStats'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/guild-stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch guild stats');
      return res.json();
    },
  });

  // Use infinite query for paginated guilds
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: guildsLoading,
    refetch: refetchGuilds,
  } = useInfiniteQuery<PaginatedGuildsResponse>({
    queryKey: ['guilds', selectedCategory],
    queryFn: async ({ pageParam }) => {
      const categoryParam = selectedCategory !== 'All' ? `&category=${selectedCategory}` : '';
      const res = await fetch(
        `http://localhost:8000/guilds/paginated?offset=${pageParam}&limit=10${categoryParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 401) {
        await signOut();
        router.replace('/');
        throw new Error('unauthorized');
      }
      if (!res.ok) throw new Error('Failed to fetch guilds');
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loadedCount = pages.reduce((sum, page) => sum + page.guilds.length, 0);
      return lastPage.hasMore ? loadedCount : undefined;
    },
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const guilds = data?.pages.flatMap(page => page.guilds) || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchGuilds()]);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleGuildPress = (guild: Guild) => {
    router.push(`/guilds/${guild.id}`);
  };

  if (guildsLoading || statsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  const renderFooter = () => {
    if (!hasNextPage) return null;
    
    return (
      <View style={styles.footerLoader}>
        {isFetchingNextPage ? (
          <ActivityIndicator size="small" color="#1a1a1a" />
        ) : (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={handleLoadMore}
          >
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderGuildItem = ({ item }: { item: Guild }) => (
    <GuildCard guild={item} onPress={() => handleGuildPress(item)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={guilds}
        keyExtractor={(item) => item.id}
        renderItem={renderGuildItem}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Guilds</Text>
              <TouchableOpacity onPress={() => router.push('create-guild')} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>＋</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dashboardContent}>
              {/* Guild Stats */}
              {guildStats && (
                <View style={styles.statsSection}>
                  <View style={styles.statsCards}>
                    <View style={styles.statsCard}>
                      <Text style={styles.statsNumber}>{guildStats.joinedGuilds}</Text>
                      <Text style={styles.statsLabel}>Joined</Text>
                    </View>
                    <View style={styles.statsCard}>
                      <Text style={styles.statsNumber}>{Math.floor(guildStats.totalXpEarned).toLocaleString()}</Text>
                      <Text style={styles.statsLabel}>Total XP</Text>
                    </View>
                    <View style={styles.statsCard}>
                      <Text style={styles.statsNumber}>{Math.floor(guildStats.averageGuildLevel)}</Text>
                      <Text style={styles.statsLabel}>Avg Level</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Category Filter */}
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              {/* Guilds Section Header */}
              <View style={styles.guildsSection}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory === 'All' ? 'Discover Guilds' : `${selectedCategory} Guilds`}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Join communities that match your interests and goals
                </Text>
              </View>
            </View>
          </>
        }
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  listContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerButtonText: {
    fontSize: 20,
    color: '#1a1a1a',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  dashboardContent: {
    paddingHorizontal: 32,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryFilter: {
    marginBottom: 24,
  },
  categoryFilterContent: {
    paddingRight: 32,
  },
  categoryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryButtonActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  guildsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '400',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    fontWeight: '400',
  },
  guildCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 28,
    marginBottom: 20,
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  guildHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  guildImageContainer: {
    marginRight: 16,
  },
  guildImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  guildImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guildImageText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#64748b',
  },
  guildInfo: {
    flex: 1,
  },
  guildName: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  guildCategory: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guildDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
    fontWeight: '400',
  },
  memberBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  memberBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guildStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guildStat: {
    alignItems: 'center',
    flex: 1,
  },
  guildStatDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
    height: 40,
  },
  guildStatLabel: {
    fontSize: 12,
    color: '#1a1a1a',
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guildStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.2,
  },
  guildStatXp: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.2,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
});