// Admin Dashboard Script

document.addEventListener('DOMContentLoaded', async function () {
    // Check user authentication status
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
        // If not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // Check if user is admin
    if (user.email !== 'shenli8103@163.com') {
        // If not admin, redirect to index page
        window.location.href = 'index.html';
        return;
    }
    
    // Display user email
    document.getElementById('userEmail').textContent = user.email;
    
    // Set up logout button
    document.getElementById('logoutBtn').addEventListener('click', async function () {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });
    
    // Set up tab navigation
    document.getElementById('clubsTab').addEventListener('click', function () {
        showTab('clubs');
    });
    
    document.getElementById('activitiesTab').addEventListener('click', function () {
        showTab('activities');
    });
    
    // Set up modal buttons
    document.getElementById('addClubBtn').addEventListener('click', function () {
        openClubModal();
    });
    
    document.getElementById('addActivityBtn').addEventListener('click', function () {
        openActivityModal();
    });
    
    document.getElementById('cancelClubBtn').addEventListener('click', function () {
        closeClubModal();
    });
    
    document.getElementById('cancelActivityBtn').addEventListener('click', function () {
        closeActivityModal();
    });
    
    // Set up form submissions
    document.getElementById('clubForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveClub();
    });
    
    document.getElementById('activityForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveActivity();
    });
    
    // Load initial data
    await loadClubs();
    await loadActivities();
    await loadClubOptions();
});

function showTab(tabName) {
    if (tabName === 'clubs') {
        document.getElementById('clubsContent').classList.remove('hidden');
        document.getElementById('activitiesContent').classList.add('hidden');
        document.getElementById('clubsTab').classList.add('border-indigo-500', 'text-indigo-600');
        document.getElementById('clubsTab').classList.remove('border-transparent', 'text-gray-500');
        document.getElementById('activitiesTab').classList.remove('border-indigo-500', 'text-indigo-600');
        document.getElementById('activitiesTab').classList.add('border-transparent', 'text-gray-500');
    } else {
        document.getElementById('clubsContent').classList.add('hidden');
        document.getElementById('activitiesContent').classList.remove('hidden');
        document.getElementById('clubsTab').classList.remove('border-indigo-500', 'text-indigo-600');
        document.getElementById('clubsTab').classList.add('border-transparent', 'text-gray-500');
        document.getElementById('activitiesTab').classList.add('border-indigo-500', 'text-indigo-600');
    }
}

// Club Management Functions
async function loadClubs() {
    try {
        const { data: clubs, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const clubsList = document.getElementById('clubsList');
        
        if (clubs.length === 0) {
            clubsList.innerHTML = '<div class="text-center py-8 text-gray-500">No clubs found.</div>';
            return;
        }
        
        clubsList.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leader</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="clubsTableBody">
                </tbody>
            </table>
        `;
        
        const clubsTableBody = document.getElementById('clubsTableBody');
        
        clubs.forEach(club => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            ${club.image_url ? 
                                `<img class="h-10 w-10 rounded-full" src="${club.image_url}" alt="${club.name}">` :
                                `<div class="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
                                    <span class="text-gray-500 text-xs">No Img</span>
                                </div>`
                            }
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${club.name}</div>
                            <div class="text-sm text-gray-500">${club.description ? club.description.substring(0, 30) + (club.description.length > 30 ? '...' : '') : ''}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${club.leader_name || 'Not specified'}</div>
                    <div class="text-sm text-gray-500">${club.leader_contact || ''}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editClub('${club.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                    <button onclick="deleteClub('${club.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            `;
            clubsTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading clubs:', error);
        document.getElementById('clubsList').innerHTML = '<div class="text-center py-8 text-red-500">Error loading clubs. Please try again later.</div>';
    }
}

function openClubModal(club = null) {
    const modal = document.getElementById('clubModal');
    const title = document.getElementById('clubModalTitle');
    const clubId = document.getElementById('clubId');
    const clubName = document.getElementById('clubName');
    const clubDescription = document.getElementById('clubDescription');
    const leaderName = document.getElementById('leaderName');
    const leaderContact = document.getElementById('leaderContact');
    const clubImagePreview = document.getElementById('clubImagePreview');
    
    if (club) {
        // Editing existing club
        title.textContent = 'Edit Club';
        clubId.value = club.id;
        clubName.value = club.name;
        clubDescription.value = club.description || '';
        leaderName.value = club.leader_name || '';
        leaderContact.value = club.leader_contact || '';
        
        if (club.image_url) {
            clubImagePreview.src = club.image_url;
            clubImagePreview.classList.remove('hidden');
        } else {
            clubImagePreview.classList.add('hidden');
        }
    } else {
        // Adding new club
        title.textContent = 'Add Club';
        clubId.value = '';
        clubName.value = '';
        clubDescription.value = '';
        leaderName.value = '';
        leaderContact.value = '';
        clubImagePreview.classList.add('hidden');
        document.getElementById('clubImage').value = '';
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeClubModal() {
    document.getElementById('clubModal').classList.add('hidden');
    document.getElementById('clubModal').classList.remove('flex');
}

async function saveClub() {
    try {
        const clubId = document.getElementById('clubId').value;
        const name = document.getElementById('clubName').value;
        const description = document.getElementById('clubDescription').value;
        const leaderName = document.getElementById('leaderName').value;
        const leaderContact = document.getElementById('leaderContact').value;
        const imageFile = document.getElementById('clubImage').files[0];
        
        let imageUrl = null;
        
        // Upload image if provided
        if (imageFile) {
            const fileName = `${Date.now()}_${imageFile.name}`;
            const { data: imageData, error: imageError } = await supabaseClient
                .storage
                .from('club-images')
                .upload(fileName, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (imageError) throw imageError;
            
            // Get public URL
            const { data: { publicUrl } } = supabaseClient
                .storage
                .from('club-images')
                .getPublicUrl(fileName);
            
            imageUrl = publicUrl;
        }
        
        if (clubId) {
            // Update existing club
            const updateData = {
                name,
                description: description || null,
                leader_name: leaderName || null,
                leader_contact: leaderContact || null
            };
            
            if (imageUrl) {
                updateData.image_url = imageUrl;
            }
            
            const { error } = await supabaseClient
                .from('clubs')
                .update(updateData)
                .eq('id', clubId);
            
            if (error) throw error;
        } else {
            // Create new club
            const { error } = await supabaseClient
                .from('clubs')
                .insert({
                    name,
                    description: description || null,
                    leader_name: leaderName || null,
                    leader_contact: leaderContact || null,
                    image_url: imageUrl || null
                });
            
            if (error) throw error;
        }
        
        // Close modal and refresh club list
        closeClubModal();
        await loadClubs();
        
        // Show success message
        alert(clubId ? 'Club updated successfully!' : 'Club created successfully!');
    } catch (error) {
        console.error('Error saving club:', error);
        alert('Error saving club: ' + error.message);
    }
}

async function editClub(clubId) {
    try {
        const { data: club, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .eq('id', clubId)
            .single();
        
        if (error) throw error;
        
        openClubModal(club);
    } catch (error) {
        console.error('Error loading club for edit:', error);
        alert('Error loading club: ' + error.message);
    }
}

async function deleteClub(clubId) {
    if (!confirm('Are you sure you want to delete this club? This will also delete all associated activities.')) {
        return;
    }
    
    try {
        // First delete associated activities
        await supabaseClient
            .from('activities')
            .delete()
            .eq('club_id', clubId);
        
        // Then delete the club
        const { error } = await supabaseClient
            .from('clubs')
            .delete()
            .eq('id', clubId);
        
        if (error) throw error;
        
        // Refresh club list
        await loadClubs();
        
        // Show success message
        alert('Club deleted successfully!');
    } catch (error) {
        console.error('Error deleting club:', error);
        alert('Error deleting club: ' + error.message);
    }
}

// Activity Management Functions
async function loadActivities() {
    try {
        const { data: activities, error } = await supabaseClient
            .from('activities')
            .select(`
                *,
                clubs (name)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const activitiesList = document.getElementById('activitiesList');
        
        if (activities.length === 0) {
            activitiesList.innerHTML = '<div class="text-center py-8 text-gray-500">No activities found.</div>';
            return;
        }
        
        activitiesList.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Time</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="activitiesTableBody">
                </tbody>
            </table>
        `;
        
        const activitiesTableBody = document.getElementById('activitiesTableBody');
        
        activities.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            ${activity.image_url ? 
                                `<img class="h-10 w-10 rounded-full" src="${activity.image_url}" alt="${activity.title}">` :
                                `<div class="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
                                    <span class="text-gray-500 text-xs">No Img</span>
                                </div>`
                            }
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${activity.title}</div>
                            <div class="text-sm text-gray-500">${activity.description ? activity.description.substring(0, 30) + (activity.description.length > 30 ? '...' : '') : ''}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${activity.clubs?.name || 'Unknown'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                        ${activity.event_time ? new Date(activity.event_time).toLocaleDateString() : 'Not specified'}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editActivity('${activity.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                    <button onclick="deleteActivity('${activity.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            `;
            activitiesTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading activities:', error);
        document.getElementById('activitiesList').innerHTML = '<div class="text-center py-8 text-red-500">Error loading activities. Please try again later.</div>';
    }
}

async function loadClubOptions() {
    try {
        const { data: clubs, error } = await supabaseClient
            .from('clubs')
            .select('id, name')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        const clubSelect = document.getElementById('activityClub');
        const currentHtml = clubSelect.innerHTML;
        
        clubSelect.innerHTML = currentHtml;
        
        clubs.forEach(club => {
            const option = document.createElement('option');
            option.value = club.id;
            option.textContent = club.name;
            clubSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading clubs for select:', error);
    }
}

function openActivityModal(activity = null) {
    const modal = document.getElementById('activityModal');
    const title = document.getElementById('activityModalTitle');
    const activityId = document.getElementById('activityId');
    const activityClub = document.getElementById('activityClub');
    const activityTitle = document.getElementById('activityTitle');
    const activityDescription = document.getElementById('activityDescription');
    const eventTime = document.getElementById('eventTime');
    const location = document.getElementById('location');
    const activityImagePreview = document.getElementById('activityImagePreview');
    
    if (activity) {
        // Editing existing activity
        title.textContent = 'Edit Activity';
        activityId.value = activity.id;
        activityClub.value = activity.club_id;
        activityTitle.value = activity.title;
        activityDescription.value = activity.description || '';
        eventTime.value = activity.event_time ? formatDateForInput(activity.event_time) : '';
        location.value = activity.location || '';
        
        if (activity.image_url) {
            activityImagePreview.src = activity.image_url;
            activityImagePreview.classList.remove('hidden');
        } else {
            activityImagePreview.classList.add('hidden');
        }
    } else {
        // Adding new activity
        title.textContent = 'Add Activity';
        activityId.value = '';
        activityClub.value = '';
        activityTitle.value = '';
        activityDescription.value = '';
        eventTime.value = '';
        location.value = '';
        activityImagePreview.classList.add('hidden');
        document.getElementById('activityImage').value = '';
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeActivityModal() {
    document.getElementById('activityModal').classList.add('hidden');
    document.getElementById('activityModal').classList.remove('flex');
}

function formatDateForInput(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function saveActivity() {
    try {
        const activityId = document.getElementById('activityId').value;
        const clubId = document.getElementById('activityClub').value;
        const title = document.getElementById('activityTitle').value;
        const description = document.getElementById('activityDescription').value;
        const eventTime = document.getElementById('eventTime').value;
        const location = document.getElementById('location').value;
        const imageFile = document.getElementById('activityImage').files[0];
        
        if (!clubId) {
            alert('Please select a club');
            return;
        }
        
        let imageUrl = null;
        
        // Upload image if provided
        if (imageFile) {
            const fileName = `${Date.now()}_${imageFile.name}`;
            const { data: imageData, error: imageError } = await supabaseClient
                .storage
                .from('activity-images')
                .upload(fileName, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (imageError) throw imageError;
            
            // Get public URL
            const { data: { publicUrl } } = supabaseClient
                .storage
                .from('activity-images')
                .getPublicUrl(fileName);
            
            imageUrl = publicUrl;
        }
        
        if (activityId) {
            // Update existing activity
            const updateData = {
                club_id: clubId,
                title,
                description: description || null,
                event_time: eventTime || null,
                location: location || null
            };
            
            if (imageUrl) {
                updateData.image_url = imageUrl;
            }
            
            const { error } = await supabaseClient
                .from('activities')
                .update(updateData)
                .eq('id', activityId);
            
            if (error) throw error;
        } else {
            // Create new activity
            const { error } = await supabaseClient
                .from('activities')
                .insert({
                    club_id: clubId,
                    title,
                    description: description || null,
                    event_time: eventTime || null,
                    location: location || null,
                    image_url: imageUrl || null
                });
            
            if (error) throw error;
        }
        
        // Close modal and refresh activity list
        closeActivityModal();
        await loadActivities();
        
        // Show success message
        alert(activityId ? 'Activity updated successfully!' : 'Activity created successfully!');
    } catch (error) {
        console.error('Error saving activity:', error);
        alert('Error saving activity: ' + error.message);
    }
}

async function editActivity(activityId) {
    try {
        const { data: activity, error } = await supabaseClient
            .from('activities')
            .select('*')
            .eq('id', activityId)
            .single();
        
        if (error) throw error;
        
        openActivityModal(activity);
    } catch (error) {
        console.error('Error loading activity for edit:', error);
        alert('Error loading activity: ' + error.message);
    }
}

async function deleteActivity(activityId) {
    if (!confirm('Are you sure you want to delete this activity?')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('activities')
            .delete()
            .eq('id', activityId);
        
        if (error) throw error;
        
        // Refresh activity list
        await loadActivities();
        
        // Show success message
        alert('Activity deleted successfully!');
    } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Error deleting activity: ' + error.message);
    }
}

// Handle image preview for club form
document.getElementById('clubImage').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('clubImagePreview').src = e.target.result;
            document.getElementById('clubImagePreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// Handle image preview for activity form
document.getElementById('activityImage').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('activityImagePreview').src = e.target.result;
            document.getElementById('activityImagePreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});