let cameraStream = null;
let currentImageFile = null;
let currentDataUrl = null;

function initOcr() {
    setupDragAndDrop();
    loadTeachersDropdown();
    
    document.getElementById('ocr-results-form').addEventListener('submit', handleSaveCheque);
    updateWorkflowUI(1);
}

// --- Workflow Navigation ---

function updateWorkflowUI(stepNumber) {
    // 1: Capture, 2: Scrutiny, 3: OCR, 4: Verify
    const steps = [
        document.getElementById('step-nav-1'),
        document.getElementById('step-nav-2'),
        document.getElementById('step-nav-3'),
        document.getElementById('step-nav-4')
    ];
    
    steps.forEach((stepEl, idx) => {
        if (!stepEl) return;
        stepEl.className = 'step'; // Reset
        if (idx + 1 < stepNumber) {
            stepEl.classList.add('completed');
        } else if (idx + 1 === stepNumber) {
            stepEl.classList.add('active');
        }
    });
    
    const captureStep = document.getElementById('ocr-step-capture');
    const cameraStep = document.getElementById('ocr-step-camera');
    const scrutinyStep = document.getElementById('ocr-step-scrutiny');
    const resultsStep = document.getElementById('ocr-step-results');
    
    if(captureStep) captureStep.style.display = (stepNumber === 1 && !cameraStream) ? 'block' : 'none';
    if(cameraStep) cameraStep.style.display = (stepNumber === 1 && cameraStream) ? 'block' : 'none';
    if(scrutinyStep) scrutinyStep.style.display = stepNumber === 2 ? 'block' : 'none';
    if(resultsStep) resultsStep.style.display = (stepNumber === 3 || stepNumber === 4) ? 'block' : 'none';
    
    if(window.lucide) lucide.createIcons();
}

function resetOCRWorkflow() {
    stopCamera();
    currentImageFile = null;
    currentDataUrl = null;
    document.getElementById('file-input').value = '';
    document.getElementById('ocr-results-form').reset();
    updateWorkflowUI(1);
}

function retakeOrUpload(mode) {
    // mode: 'camera' or 'upload'
    updateWorkflowUI(1);
    if (mode === 'camera') {
        startCamera();
    } else {
        document.getElementById('file-input').click();
    }
}

// --- Camera Logic ---

async function startCamera() {
    try {
        const video = document.getElementById('camera-video');
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        video.srcObject = cameraStream;
        updateWorkflowUI(1);
    } catch (err) {
        console.error("Camera error:", err);
        window.showToast("Cannot access camera. Please check permissions or upload an image instead.", "error");
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    const video = document.getElementById('camera-video');
    if(video) video.srcObject = null;
    updateWorkflowUI(1);
}

function captureImage() {
    const video = document.getElementById('camera-video');
    if (!video || !cameraStream) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    currentDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Create a mock file object from data url
    fetch(currentDataUrl)
        .then(res => res.blob())
        .then(blob => {
            currentImageFile = new File([blob], "captured_cheque.jpg", { type: "image/jpeg" });
            stopCamera();
            startScrutiny();
        });
}

// --- Upload Logic ---

function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    if(!dropZone || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.backgroundColor = 'var(--emerald-light)';
            dropZone.style.borderColor = 'var(--emerald)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.backgroundColor = '';
            dropZone.style.borderColor = 'var(--border)';
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        handleFiles(dt.files);
    }, false);

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
}

function handleFiles(files) {
    if (files.length === 0) return;
    const file = files[0];
    
    // Check size (<10MB)
    if (file.size > 10 * 1024 * 1024) {
        window.showToast("File is too large. Max 10MB.", "error");
        return;
    }
    
    if (!file.type.match('image.*')) {
        window.showToast('Please select an image file.', 'error');
        return;
    }
    
    currentImageFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        currentDataUrl = e.target.result;
        startScrutiny();
    };
    reader.readAsDataURL(file);
}

// --- Scrutiny Logic ---

async function startScrutiny() {
    updateWorkflowUI(2);
    
    // Setup preview
    const previewImg = document.getElementById('scrutiny-image-preview');
    const meta = document.getElementById('scrutiny-image-meta');
    previewImg.src = currentDataUrl;
    meta.textContent = `${currentImageFile.name || 'image.jpg'} • ${(currentImageFile.size / (1024*1024)).toFixed(2)} MB`;
    
    // Reset UI to processing
    document.getElementById('scrutiny-processing').style.display = 'block';
    document.getElementById('scrutiny-result-pass').style.display = 'none';
    document.getElementById('scrutiny-result-fail').style.display = 'none';
    
    // Reset animation classes
    const steps = ['s-step-2', 's-step-3', 's-step-4'];
    steps.forEach(s => {
        const el = document.getElementById(s);
        if(el) {
            el.style.opacity = '0.5';
            el.innerHTML = `<i data-lucide="circle" style="width:16px;"></i> ${el.innerText.trim()}`;
        }
    });
    if(window.lucide) lucide.createIcons();
    
    // Simulate animation steps
    for(let i=0; i<steps.length; i++) {
        await api.delay(600); // 600ms per step
        const el = document.getElementById(steps[i]);
        if(el) {
            el.style.opacity = '1';
            el.innerHTML = `<i data-lucide="check-circle-2" style="width:16px; color:var(--emerald);"></i> ${el.innerText.trim()}`;
            if(window.lucide) lucide.createIcons();
        }
    }
    
    // Call the mock scrutiny API
    try {
        const result = await api.runChequeScrutiny(currentImageFile);
        document.getElementById('scrutiny-processing').style.display = 'none';
        
        if (result.is_cheque && result.issues.length === 0) {
            renderScrutinyPass(result);
        } else {
            renderScrutinyFail(result);
        }
        
    } catch (e) {
        window.showToast("Scrutiny failed due to network error.", "error");
        resetOCRWorkflow();
    }
}

function renderScrutinyPass(result) {
    document.getElementById('scrutiny-result-pass').style.display = 'block';
    
    const confidencePct = Math.round(result.confidence * 100);
    document.getElementById('pass-confidence-val').textContent = `${confidencePct}%`;
    document.getElementById('pass-confidence-bar').style.width = `${confidencePct}%`;
}

function renderScrutinyFail(result) {
    document.getElementById('scrutiny-result-fail').style.display = 'block';
    
    document.getElementById('fail-desc').textContent = result.reason || "The uploaded image does not appear to be a cheque.";
    
    const issuesList = document.getElementById('fail-issues-list');
    issuesList.innerHTML = '';
    result.issues.forEach(issue => {
        const li = document.createElement('li');
        li.textContent = issue;
        issuesList.appendChild(li);
    });
}

// --- OCR Logic ---

async function proceedToOCR() {
    updateWorkflowUI(3);
    
    document.getElementById('ocr-processing-section').style.display = 'block';
    document.getElementById('ocr-verification-section').style.display = 'none';
    
    const steps = ['ocr-step-1', 'ocr-step-2'];
    for(let i=0; i<steps.length; i++) {
        await api.delay(800);
        const el = document.getElementById(steps[i]);
        if(el) {
            el.style.opacity = '1';
            el.innerHTML = `<i data-lucide="check-circle-2" style="width:16px; color:var(--emerald);"></i> ${el.innerText.trim()}`;
            if(window.lucide) lucide.createIcons();
        }
    }
    
    try {
        const results = await api.processOCR(currentImageFile);
        
        document.getElementById('ocr-processing-section').style.display = 'none';
        document.getElementById('ocr-verification-section').style.display = 'block';
        updateWorkflowUI(4);
        
        document.getElementById('res-number').value = results.number;
        document.getElementById('res-amount').value = results.amount;
        document.getElementById('res-date').value = results.date;
        document.getElementById('res-payee').value = results.payee;
        document.getElementById('res-account').value = results.account;
        
        // Update Field-level Confidences and Crop Images
        if (results.fields) {
            const setConfidence = (id, fieldName) => {
                const badge = document.getElementById(id);
                if (!badge || !results.fields[fieldName]) return;
                
                let conf = results.fields[fieldName].confidence;
                // If it's 0-1 range, multiply by 100
                if (conf <= 1) conf = Math.round(conf * 100);
                
                badge.textContent = `${conf}%`;
                badge.className = 'conf-badge';
                
                if (conf >= 90) {
                    badge.classList.add('conf-high');
                    badge.textContent += ' (Good)';
                } else if (conf >= 75) {
                    badge.classList.add('conf-medium');
                    badge.textContent += ' (Review)';
                } else {
                    badge.classList.add('conf-low');
                    badge.textContent += ' (Review)';
                }
            };
            
            setConfidence('conf-number', 'micr_strip');
            setConfidence('conf-amount', 'amount_numbers');
            setConfidence('conf-date', 'date');
            setConfidence('conf-payee', 'payee');
            setConfidence('conf-account', 'account');
        }
        
        // Force reload crops to bypass browser cache
        const cacheBuster = `?t=${Date.now()}`;
        document.getElementById('crop-number').src = `/debug_crops/micr_strip_crop.jpg${cacheBuster}`;
        document.getElementById('crop-amount').src = `/debug_crops/amount_numbers_crop.jpg${cacheBuster}`;
        document.getElementById('crop-date').src = `/debug_crops/date_crop.jpg${cacheBuster}`;
        document.getElementById('crop-payee').src = `/debug_crops/payee_crop.jpg${cacheBuster}`;
        document.getElementById('crop-account').src = `/debug_crops/account_crop.jpg${cacheBuster}`;
        
        const teachers = await api.getTeachers();
        
        // Try to match by Exact Name, or Partial Name, or Account Number
        const possibleMatch = teachers.find(c => 
            c.name.toLowerCase() === results.payee.toLowerCase() ||
            results.payee.toLowerCase().includes(c.name.toLowerCase()) ||
            c.account.endsWith(results.account.replace(/X/g, ''))
        );
        
        if (possibleMatch) {
            document.getElementById('res-teacher').value = possibleMatch.id;
            window.showToast(`Auto-assigned to ${possibleMatch.name}`, 'info');
        } else {
            window.showToast(`Review extracted fields and assign a teacher.`, 'info');
        }
        
    } catch (e) {
        window.showToast('Failed to process OCR.', 'error');
        resetOCRWorkflow();
    }
}

async function loadTeachersDropdown() {
    const teachers = await api.getTeachers();
    const select = document.getElementById('res-teacher');
    if(!select) return;
    
    select.innerHTML = '<option value="">Select a teacher...</option>';
    teachers.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = `${c.name} (A/c: ${c.account})`;
        select.appendChild(option);
    });
}

async function handleSaveCheque(e) {
    e.preventDefault();
    
    const newCheque = {
        number: document.getElementById('res-number').value,
        amount: parseFloat(document.getElementById('res-amount').value),
        date: document.getElementById('res-date').value,
        teacherId: document.getElementById('res-teacher').value,
        status: 'collected',
        bank: 'Extracted Bank'
    };
    
    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-top-color:#fff;display:inline-block;vertical-align:middle;"></div> Saving...';
        
        await api.addCheque(newCheque);
        
        window.showToast('Cheque saved successfully!', 'success');
        
        setTimeout(() => {
            window.location.hash = '#/cheques';
        }, 1000);
        
    } catch (err) {
        window.showToast('Error saving cheque.', 'error');
        e.target.querySelector('button[type="submit"]').disabled = false;
        e.target.querySelector('button[type="submit"]').innerHTML = 'Save Cheque';
    }
}
