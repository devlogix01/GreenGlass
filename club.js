// Club Details Script

let currentUser = null;
let currentClubId = null;

document.addEventListener('DOMContentLoaded', async function () {
    // Check user authentication status
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        // If not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    // Display user email
    document.getElementById('userEmail').textContent = user.email;

    // Set up logout button
    document.getElementById('logoutBtn').addEventListener('click', async function () {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });

    // Get club ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const clubId = urlParams.get('id');

    if (!clubId) {
        // If no club ID, redirect to index
        window.location.href = 'index.html';
        return;
    }

    currentClubId = clubId;

    // Load club details
    await loadClubDetails(clubId);

    // Load activities for this club
    await loadClubActivities(clubId);
});

async function loadClubDetails(clubId) {
    try {
        const { data: club, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .eq('id', clubId)
            .single();

        if (error) throw error;

        // Check if user is a member
        const { data: membership } = await supabaseClient
            .from('community_members')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('club_id', clubId)
            .maybeSingle();

        const isMember = !!membership;

        // Get member count
        const { count: memberCount } = await supabaseClient
            .from('community_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', clubId);

        const clubDetails = document.getElementById('clubDetails');

        clubDetails.innerHTML = `
            <div class="h-64 overflow-hidden">
                ${club.image_url ?
                `<img src="${club.image_url}" alt="${club.name}" class="w-full h-full object-cover">` :
                `<div class="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">
                        <span class="text-gray-500">No Image</span>
                    </div>`
            }
            </div>
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">${club.name}</h2>
                        <p class="text-sm text-gray-500">${memberCount || 0} members</p>
                    </div>
                    <button id="joinBtn" 
                        class="px-6 py-2 ${isMember ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'} text-white font-semibold rounded-xl shadow-lg transition-all duration-200 active:scale-95">
                        ${isMember ? 'Leave Community' : 'Join Community'}
                    </button>
                </div>
                <p class="text-gray-600 mb-4">${club.description || 'No description available.'}</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">Club Leader</h3>
                        <p class="text-gray-600">${club.leader_name || 'Not specified'}</p>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">Contact</h3>
                        <p class="text-gray-600">${club.leader_contact || 'Not specified'}</p>
                    </div>
                </div>
            </div>
        `;

        // Add event listener to join/leave button
        document.getElementById('joinBtn').addEventListener('click', () => {
            if (isMember) {
                leaveCommunity(clubId);
            } else {
                joinCommunity(clubId);
            }
        });
    } catch (error) {
        console.error('Error loading club details:', error);
        document.getElementById('clubDetails').innerHTML = '<div class="text-center py-8 text-red-500">Error loading club details. Please try again later.</div>';
    }
}

async function loadClubActivities(clubId) {
    try {
        const { data: activities, error } = await supabaseClient
            .from('activities')
            .select('*')
            .eq('club_id', clubId)
            .order('event_time', { ascending: true });

        if (error) throw error;

        const activitiesContainer = document.getElementById('activitiesContainer');

        if (activities.length === 0) {
            activitiesContainer.innerHTML = '<div class="text-center py-8 text-gray-500 col-span-full">No activities found for this club.</div>';
            return;
        }

        activitiesContainer.innerHTML = '';

        activities.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300';
            activityElement.innerHTML = `
                <div class="h-48 overflow-hidden">
                    ${activity.image_url ?
                    `<img src="${activity.image_url}" alt="${activity.title}" class="w-full h-full object-cover">` :
                    `<div class="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">
                            <span class="text-gray-500">No Image</span>
                        </div>`
                }
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${activity.title}</h3>
                    <p class="text-gray-600 mb-4">${activity.description ? activity.description.substring(0, 100) + (activity.description.length > 100 ? '...' : '') : 'No description available.'}</p>
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm text-gray-500">
                                ${activity.event_time ? new Date(activity.event_time).toLocaleDateString() : 'Date not specified'}
                            </p>
                        </div>
                        <a href="activity.html?id=${activity.id}" class="text-indigo-600 hover:text-indigo-800 font-medium">
                            View Details
                        </a>
                    </div>
                </div>
            `;
            activitiesContainer.appendChild(activityElement);
        });
    } catch (error) {
        console.error('Error loading activities:', error);
        document.getElementById('activitiesContainer').innerHTML = '<div class="text-center py-8 text-red-500 col-span-full">Error loading activities. Please try again later.</div>';
    }
}

// Join Community Function
async function joinCommunity(clubId) {
    try {
        const { error } = await supabaseClient
            .from('community_members')
            .insert([{
                user_id: currentUser.id,
                club_id: clubId,
                role: 'member'
            }]);

        if (error) throw error;

        // Reload club details to update UI
        await loadClubDetails(clubId);

        // Show success message
        alert('Successfully joined the community!');
    } catch (error) {
        console.error('Error joining community:', error);
        if (error.code === '23505') {
            alert('You are already a member of this community.');
        } else {
            alert('Failed to join community. Please try again.');
        }
    }
}

// Leave Community Function
async function leaveCommunity(clubId) {
    if (!confirm('Are you sure you want to leave this community?')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('community_members')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('club_id', clubId);

        if (error) throw error;

        // Reload club details to update UI
        await loadClubDetails(clubId);

        // Show success message
        alert('Successfully left the community.');
    } catch (error) {
        console.error('Error leaving community:', error);
        alert('Failed to leave community. Please try again.');
    }
}