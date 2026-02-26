document.addEventListener("DOMContentLoaded", () => {
    initAddressLogic();
});

// Since we use the SPA transition logic in home.js to load new content sometimes without full DOMContentLoaded reload,
// it might be better to init logic directly or allow home.js robust calling.
// However scripts loaded dynamically via SPA do get executed within `executePageScripts` if implemented.
// We'll define init so it runs correctly now and can be called if needed.

function initAddressLogic() {
    const pageContent = document.getElementById("page-content");
    if (!pageContent) return;

    const isLoggedIn = pageContent.getAttribute("data-logged-in") === "true";
    
    const addNewAddressBtn = document.getElementById("addNewAddressBtn");
    const editAddressBtn = document.getElementById("editAddressBtn");
    const addressFormContainer = document.getElementById("addressFormContainer");
    const addressForm = document.getElementById("addressForm");
    const cancelAddressBtn = document.getElementById("cancelAddressBtn");
    const savedAddressView = document.getElementById("savedAddressView");
    const emptyAddressView = document.getElementById("emptyAddressView");

    function handleAddEditClick(e) {
        if (!isLoggedIn) {
            window.location.href = "/login/?next=/address/";
            return;
        }
        
        // Hide list view, show form
        if (savedAddressView) savedAddressView.style.display = "none";
        if (emptyAddressView) emptyAddressView.style.display = "none";
        
        addressFormContainer.style.display = "block";
        
        // Hide address header actions if necessary, or just rely on the form being shown
        const addActions = document.querySelector('.address-container > .address-actions');
        if (addActions) addActions.style.display = "none";
    }

    if (addNewAddressBtn) addNewAddressBtn.addEventListener("click", handleAddEditClick);
    if (editAddressBtn) editAddressBtn.addEventListener("click", handleAddEditClick);

    if (cancelAddressBtn) {
        cancelAddressBtn.addEventListener("click", () => {
             addressFormContainer.style.display = "none";
             
             if (savedAddressView) savedAddressView.style.display = "block";
             if (emptyAddressView) emptyAddressView.style.display = "block";
             
             const addActions = document.querySelector('.address-container > .address-actions');
             if (addActions) addActions.style.display = "flex";
        });
    }

    if (addressForm) {
        addressForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById("saveAddressBtn");
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Saving...";
            submitBtn.disabled = true;

            const payload = {
                full_name: document.getElementById("id_full_name").value,
                phone_number: document.getElementById("id_phone_number").value,
                address_type: document.getElementById("id_address_type").value,
                full_address: document.getElementById("id_full_address").value,
                pincode: document.getElementById("id_pincode").value,
            };

            try {
                const response = await fetch('/api/save-address/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.success) {
                    // Quick reload to show updated address state
                    window.location.reload();
                } else {
                    alert(data.message || "Failed to save address.");
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error("Save error:", error);
                alert("Network error. Please try again.");
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

initAddressLogic();
