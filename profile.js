// Profile Page JavaScript
document.addEventListener('DOMContentLoaded', async function () {
    let currentUser = null;
    let userProfile = null;
    let isEditMode = false;

    // Check authentication
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;

    // Initialize page
    await initializePage();

    // Event Listeners
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('editProfileBtn').addEventListener('click', toggleEditMode);
    document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target));
    });

    // Functions
    async function initializePage() {
        // Display user email
        document.getElementById('userEmail').textContent = currentUser.email;

        // Load user profile
        await loadUserProfile();

        // Load bookmarks and communities
        await loadBookmarks();
        await loadCommunities();

        // Update stats
        updateStats();
    }

    async function loadUserProfile() {
        try {
            // Check if user_profiles table exists and get profile
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                // PGRST116 means no rows returned
                console.error('Error loading profile:', error);
            }

            if (data) {
                userProfile = data;
                displayProfile(data);
            } else {
                // Create default profile
                await createDefaultProfile();
            }
        } catch (error) {
            console.error('Error in loadUserProfile:', error);
            // Display default values
            displayProfile({
                name: 'New User',
                about: '',
                phone: ''
            });
        }
    }

    async function createDefaultProfile() {
        try {
            const defaultProfile = {
                user_id: currentUser.id,
                email: currentUser.email,
                name: currentUser.email.split('@')[0],
                about: '',
                phone: ''
            };

            const { data, error } = await supabaseClient
                .from('user_profiles')
                .insert([defaultProfile])
                .select()
                .single();

            if (error) throw error;

            userProfile = data;
            displayProfile(data);
        } catch (error) {
            console.error('Error creating default profile:', error);
        }
    }

    function displayProfile(profile) {
        // Update display name
        const name = profile.name || 'User';
        document.getElementById('displayName').textContent = name;

        // Update avatar initials
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        document.getElementById('avatarInitials').textContent = initials;

        // Update form fields
        document.getElementById('inputName').value = profile.name || '';
        document.getElementById('inputAbout').value = profile.about || '';
        document.getElementById('inputPhone').value = profile.phone || '';

        // Disable form initially
        setFormEditMode(false);
    }

    function toggleEditMode() {
        isEditMode = !isEditMode;
        setFormEditMode(isEditMode);

        const btn = document.getElementById('editProfileBtn');
        if (isEditMode) {
            btn.textContent = 'Cancel Edit';
            btn.classList.remove('bg-violet-600', 'hover:bg-violet-700');
            btn.classList.add('bg-slate-600', 'hover:bg-slate-700');
        } else {
            btn.textContent = 'Edit Profile';
            btn.classList.remove('bg-slate-600', 'hover:bg-slate-700');
            btn.classList.add('bg-violet-600', 'hover:bg-violet-700');
            // Reload profile to discard changes
            if (userProfile) {
                displayProfile(userProfile);
            }
        }
    }

    function setFormEditMode(enabled) {
        const inputs = document.querySelectorAll('#profileForm input, #profileForm textarea');
        inputs.forEach(input => {
            input.disabled = !enabled;
            if (enabled) {
                input.classList.remove('bg-slate-50', 'cursor-not-allowed');
            } else {
                input.classList.add('bg-slate-50', 'cursor-not-allowed');
            }
        });

        // Show/hide form buttons
        const submitBtn = document.querySelector('#profileForm button[type="submit"]');
        const cancelBtn = document.getElementById('cancelBtn');
        if (enabled) {
            submitBtn.classList.remove('hidden');
            cancelBtn.classList.remove('hidden');
        } else {
            submitBtn.classList.add('hidden');
            cancelBtn.classList.add('hidden');
        }
    }

    function cancelEdit() {
        toggleEditMode();
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();

        const name = document.getElementById('inputName').value.trim();
        const about = document.getElementById('inputAbout').value.trim();
        const phone = document.getElementById('inputPhone').value.trim();

        try {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .update({
                    name: name,
                    about: about,
                    phone: phone,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', currentUser.id)
                .select()
                .single();

            if (error) throw error;

            userProfile = data;
            displayProfile(data);
            showMessage('success', 'Profile updated successfully!');
            toggleEditMode();
        } catch (error) {
            console.error('Error updating profile:', error);
            showMessage('error', 'Failed to update profile. Please try again.');
        }
    }

    async function loadBookmarks() {
        try {
            const { data, error } = await supabaseClient
                .from('bookmarks')
                .select(`
                    *,
                    activities (
                        id,
                        title,
                        description,
                        image_url,
                        event_time,
                        location,
                        club_id,
                        clubs (
                            name
                        )
                    )
                `)
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error && error.code !== '42P01') {
                // 42P01 means table doesn't exist
                console.error('Error loading bookmarks:', error);
            }

            const container = document.getElementById('bookmarksContainer');

            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-12">
                        <svg class="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                        </svg>
                        <p class="text-slate-600 font-medium mb-2">No bookmarked events yet</p>
                        <p class="text-slate-500 text-sm">Start exploring and bookmark your favorite events!</p>
                        <a href="index.html" class="mt-4 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all">
                            Explore Events
                        </a>
                    </div>
                `;
                return;
            }

            container.innerHTML = data.map(bookmark => {
                const activity = bookmark.activities;
                if (!activity) return '';

                const eventDate = activity.event_time ? new Date(activity.event_time).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }) : 'Date TBA';

                return `
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 flex gap-4">
                        <div class="w-24 h-24 bg-gradient-to-br from-violet-100 to-violet-200 rounded-lg flex-shrink-0 overflow-hidden">
                            ${activity.image_url ?
                        `<img src="${activity.image_url}" alt="${activity.title}" class="w-full h-full object-cover">` :
                        `<div class="w-full h-full flex items-center justify-center">
                                    <svg class="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>`
                    }
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-semibold text-slate-900 mb-1 truncate">${activity.title}</h4>
                            <p class="text-sm text-slate-600 mb-2">${activity.clubs?.name || 'Unknown Club'}</p>
                            <div class="flex items-center gap-4 text-xs text-slate-500">
                                <span class="flex items-center gap-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    ${eventDate}
                                </span>
                                ${activity.location ? `
                                    <span class="flex items-center gap-1">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        </svg>
                                        ${activity.location}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        <button onclick="removeBookmark('${bookmark.id}')" class="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                `;
            }).join('');

            // Update bookmark count
            document.getElementById('bookmarkedCount').textContent = data.length;
        } catch (error) {
            console.error('Error in loadBookmarks:', error);
            const container = document.getElementById('bookmarksContainer');
            container.innerHTML = `
                <div class="text-center py-12 text-slate-600">
                    <p>Unable to load bookmarks at this time.</p>
                </div>
            `;
        }
    }

    async function loadCommunities() {
        try {
            const { data, error } = await supabaseClient
                .from('community_members')
                .select(`
                    *,
                    clubs (
                        id,
                        name,
                        description,
                        image_url,
                        leader_name
                    )
                `)
                .eq('user_id', currentUser.id)
                .order('joined_at', { ascending: false });

            if (error && error.code !== '42P01') {
                console.error('Error loading communities:', error);
            }

            const container = document.getElementById('communitiesContainer');

            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-12">
                        <svg class="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <p class="text-slate-600 font-medium mb-2">Not a member of any community yet</p>
                        <p class="text-slate-500 text-sm">Join clubs to connect with like-minded people!</p>
                        <a href="index.html" class="mt-4 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all">
                            Browse Clubs
                        </a>
                    </div>
                `;
                return;
            }

            container.innerHTML = data.map(member => {
                const club = member.clubs;
                if (!club) return '';

                const joinedDate = new Date(member.joined_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                });

                return `
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 flex gap-4">
                        <div class="w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-200 rounded-lg flex-shrink-0 overflow-hidden">
                            ${club.image_url ?
                        `<img src="${club.image_url}" alt="${club.name}" class="w-full h-full object-cover">` :
                        `<div class="w-full h-full flex items-center justify-center">
                                    <svg class="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                    </svg>
                                </div>`
                    }
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-semibold text-slate-900 mb-1">${club.name}</h4>
                            <p class="text-sm text-slate-600 mb-2 line-clamp-2">${club.description || 'No description available'}</p>
                            <p class="text-xs text-slate-500">Member since ${joinedDate}</p>
                        </div>
                        <a href="club.html?id=${club.id}" class="flex-shrink-0 p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors self-start">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </a>
                    </div>
                `;
            }).join('');

            // Update communities count
            document.getElementById('communitiesCount').textContent = data.length;
        } catch (error) {
            console.error('Error in loadCommunities:', error);
            const container = document.getElementById('communitiesContainer');
            container.innerHTML = `
                <div class="text-center py-12 text-slate-600">
                    <p>Unable to load communities at this time.</p>
                </div>
            `;
        }
    }

    function updateStats() {
        // Stats are updated in loadBookmarks and loadCommunities
    }

    function switchTab(clickedTab) {
        // Remove active state from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('text-violet-600', 'border-violet-600');
            btn.classList.add('text-slate-600', 'border-transparent');
        });

        // Add active state to clicked tab
        clickedTab.classList.remove('text-slate-600', 'border-transparent');
        clickedTab.classList.add('text-violet-600', 'border-violet-600');

        // Hide all content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        // Show corresponding content
        const tabId = clickedTab.id.replace('tab', 'content');
        document.getElementById(tabId).classList.remove('hidden');
    }

    function showMessage(type, message) {
        const container = document.getElementById('messageContainer');
        const successMsg = document.getElementById('successMessage');
        const errorMsg = document.getElementById('errorMessage');

        container.classList.remove('hidden');

        if (type === 'success') {
            successMsg.textContent = message;
            successMsg.classList.remove('hidden');
            errorMsg.classList.add('hidden');
        } else {
            errorMsg.textContent = message;
            errorMsg.classList.remove('hidden');
            successMsg.classList.add('hidden');
        }

        // Hide message after 5 seconds
        setTimeout(() => {
            container.classList.add('hidden');
        }, 5000);
    }

    async function handleLogout() {
        try {
            await supabaseClient.auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }

    // Make removeBookmark available globally
    window.removeBookmark = async function (bookmarkId) {
        if (!confirm('Are you sure you want to remove this bookmark?')) {
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('bookmarks')
                .delete()
                .eq('id', bookmarkId);

            if (error) throw error;

            // Reload bookmarks
            await loadBookmarks();
            showMessage('success', 'Bookmark removed successfully!');
        } catch (error) {
            console.error('Error removing bookmark:', error);
            showMessage('error', 'Failed to remove bookmark. Please try again.');
        }
    };
});
