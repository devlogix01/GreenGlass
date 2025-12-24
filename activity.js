// Activity Details Script

let currentUser = null;
let currentActivityId = null;

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

    // Get activity ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const activityId = urlParams.get('id');

    if (!activityId) {
        // If no activity ID, redirect to index
        window.location.href = 'index.html';
        return;
    }

    currentActivityId = activityId;

    // Load activity details
    await loadActivityDetails(activityId);
});

async function loadActivityDetails(activityId) {
    try {
        // First, get the activity details
        const { data: activity, error: activityError } = await supabaseClient
            .from('activities')
            .select(`
                *,
                clubs (id, name)
            `)
            .eq('id', activityId)
            .single();

        if (activityError) throw activityError;

        // Check if activity is bookmarked
        const { data: bookmark } = await supabaseClient
            .from('bookmarks')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('activity_id', activityId)
            .maybeSingle();

        const isBookmarked = !!bookmark;

        // Get bookmark count
        const { count: bookmarkCount } = await supabaseClient
            .from('bookmarks')
            .select('*', { count: 'exact', head: true })
            .eq('activity_id', activityId);

        // Set up back link
        document.getElementById('backLink').href = `club.html?id=${activity.club_id}`;

        const activityDetails = document.getElementById('activityDetails');

        // Create Google Maps link if location exists
        const locationHTML = activity.location && activity.location !== 'Not specified'
            ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="text-violet-600 hover:text-violet-700 font-medium transition-colors duration-200 flex items-center group">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500 mr-2 group-hover:text-violet-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class="border-b border-violet-300 group-hover:border-violet-600 transition-colors">${activity.location}</span>
                  <svg class="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
               </a>`
            : `<span class="text-slate-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Not specified
               </span>`;

        activityDetails.innerHTML = `
            <div class="aspect-video overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                ${activity.image_url ?
                `<img src="${activity.image_url}" alt="${activity.title}" class="w-full h-full object-cover">` :
                `<div class="w-full h-full flex items-center justify-center">
                        <svg class="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>`
            }
            </div>
            <div class="p-8">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h2 class="text-3xl font-bold text-slate-900 mb-2">${activity.title}</h2>
                        <p class="text-sm text-slate-500">${bookmarkCount || 0} people bookmarked this event</p>
                    </div>
                    <button id="bookmarkBtn" 
                        class="px-6 py-2 ${isBookmarked ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-violet-600 hover:bg-violet-700'} text-white font-semibold rounded-xl shadow-lg transition-all duration-200 active:scale-95 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                        </svg>
                        ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>
                </div>
                <p class="text-slate-600 text-base leading-relaxed mb-8">${activity.description || 'No description available.'}</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                            <span class="w-1 h-5 bg-violet-600 rounded-full mr-2"></span>
                            Event Details
                        </h3>
                        <div class="space-y-3 pl-3">
                            <div class="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span class="text-slate-700">${activity.event_time ? new Date(activity.event_time).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Not specified'}</span>
                            </div>
                            <div class="flex items-start">
                                ${locationHTML}
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                            <span class="w-1 h-5 bg-violet-600 rounded-full mr-2"></span>
                            Organized by
                        </h3>
                        <div class="pl-3">
                            <p class="text-slate-700 font-medium">${activity.clubs?.name || 'Club information not available'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listener to bookmark button
        document.getElementById('bookmarkBtn').addEventListener('click', () => {
            if (isBookmarked) {
                removeBookmark(activityId);
            } else {
                addBookmark(activityId);
            }
        });
    } catch (error) {
        console.error('Error loading activity details:', error);
        document.getElementById('activityDetails').innerHTML = '<div class="text-center py-8 text-red-500">Error loading activity details. Please try again later.</div>';
    }
}

// Add Bookmark Function
async function addBookmark(activityId) {
    try {
        const { error } = await supabaseClient
            .from('bookmarks')
            .insert([{
                user_id: currentUser.id,
                activity_id: activityId
            }]);

        if (error) throw error;

        // Reload activity details to update UI
        await loadActivityDetails(activityId);

        // Show success message
        alert('Event bookmarked successfully!');
    } catch (error) {
        console.error('Error adding bookmark:', error);
        if (error.code === '23505') {
            alert('You have already bookmarked this event.');
        } else {
            alert('Failed to bookmark event. Please try again.');
        }
    }
}

// Remove Bookmark Function
async function removeBookmark(activityId) {
    if (!confirm('Are you sure you want to remove this bookmark?')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('bookmarks')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('activity_id', activityId);

        if (error) throw error;

        // Reload activity details to update UI
        await loadActivityDetails(activityId);

        // Show success message
        alert('Bookmark removed successfully.');
    } catch (error) {
        console.error('Error removing bookmark:', error);
        alert('Failed to remove bookmark. Please try again.');
    }
}