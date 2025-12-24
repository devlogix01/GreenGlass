// Main Application Script

document.addEventListener('DOMContentLoaded', async function () {
    // Check user authentication status
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
        // If not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // Display user email
    document.getElementById('userEmail').textContent = user.email;
    
    // Set up logout button
    document.getElementById('logoutBtn').addEventListener('click', async function () {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });
    
    // Check if user is admin
    const isAdmin = user.email === 'shenli8103@163.com';
    
    // Show admin controls if user is admin
    if (isAdmin) {
        document.getElementById('adminControls').classList.remove('hidden');
    }
    
    // Load clubs
    await loadClubs();
});

async function loadClubs() {
    try {
        const { data: clubs, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const clubsContainer = document.getElementById('clubsContainer');
        
        if (clubs.length === 0) {
            clubsContainer.innerHTML = '<div class="text-center py-8 text-gray-500 col-span-full">No clubs found.</div>';
            return;
        }
        
        clubsContainer.innerHTML = '';
        
        clubs.forEach(club => {
            const clubElement = document.createElement('div');
            clubElement.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300';
            clubElement.innerHTML = `
                <div class="h-48 overflow-hidden">
                    ${club.image_url ? 
                        `<img src="${club.image_url}" alt="${club.name}" class="w-full h-full object-cover">` :
                        `<div class="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">
                            <span class="text-gray-500">No Image</span>
                        </div>`
                    }
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${club.name}</h3>
                    <p class="text-gray-600 mb-4">${club.description ? club.description.substring(0, 100) + (club.description.length > 100 ? '...' : '') : 'No description available.'}</p>
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm text-gray-500">Leader: ${club.leader_name || 'Not specified'}</p>
                        </div>
                        <a href="club.html?id=${club.id}" class="text-indigo-600 hover:text-indigo-800 font-medium">
                            View Details
                        </a>
                    </div>
                </div>
            `;
            clubsContainer.appendChild(clubElement);
        });
    } catch (error) {
        console.error('Error loading clubs:', error);
        document.getElementById('clubsContainer').innerHTML = '<div class="text-center py-8 text-red-500 col-span-full">Error loading clubs. Please try again later.</div>';
    }
}