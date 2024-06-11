export async function run_backend_process(filename, input_text, repoB_name) {

	// n is the maximum salt length used
	var obj_env = await GET_text_from_file_wo_auth_GitHub_RESTAPI(".env", repoB_name);
	var obj = {env_text: obj_env.text.replace(/[\n\s]/g, ""), env_file_download_url: obj_env.file_download_url, env_sha: obj_env.sha, n: 1, filename: filename, input_text: input_text, repoB_name: repoB_name};
	await run_backend(obj);
	
}


// ----------------------------------------------------

	
async function run_backend(obj) {
	
	// Try each of the 'de-salted' authorization keys to identify the correct key: loop over a REST API request and identify which key succeeds
	// console.log('obj.repoB_name: ', obj.repoB_name);
	
	// [0] Determine if filename exists
	var obj_temp = await GET_fileDownloadUrl_and_sha(obj.filename, obj.repoB_name)

	// [1] Add obj_env and obj_temp to the general object (obj)
	// obj.env_text
	// obj.env_file_download_url
	// obj.env_sha
	obj.env_desired_path = obj.env_file_download_url.split('main/').pop();
	// console.log('obj.env_desired_path: ', obj.env_desired_path);
	
	obj.temp_file_download_url = obj_temp.file_download_url[0]; // this is a string
	obj.temp_desired_path = obj.temp_file_download_url.split('main/').pop();
	obj.temp_sha = obj_temp.sha_arr[0]; // this is a string
	
	obj.auth = obj.env_text; // Initialize value
	obj.status = 0; // Initialize value
		
	// [2] Loop over the number of possible values
	let i = 0;
	var regexp = /^20/g;
	var x = Array.from({ length: (obj.n*2)+1 }, (_, ind) => ind);
	console.log('x: ', x);
	
	var x_rand = await rand_perm(x);
	console.log('x_rand: ', x_rand);

	console.log('obj.n: ', obj.n);
	
	while (regexp.test(obj.status) == false && obj.auth != null && i < (obj.n*2)+1) {
		
		obj = await decode_desalt(obj, x_rand[i])
			.then(async function(obj) {
				
				if (obj.temp_file_download_url == "No_file_found") {
					// Option 0: create a new file
					obj.status = await PUT_create_a_file_RESTAPI(obj.auth, 'run GitHub Action', obj.input_text, obj.filename, obj.repoB_name)
						.then(async function(out) { await new Promise(r => setTimeout(r, 2000)); return out.status; })
						.catch(error => { document.getElementById("error").innerHTML = error; });
				} else {
					// Option 1: modify an existing file
					obj.status = await PUT_add_to_a_file_RESTAPI(obj.auth, 'run GitHub Action', obj.input_text, obj.temp_desired_path, obj.temp_sha, obj.repoB_name)
						.then(async function(out) { await new Promise(r => setTimeout(r, 2000)); return out.status; })
						.catch(error => { document.getElementById("error").innerHTML = error; });
				}
				
				if (regexp.test(obj.status) == true) {
					// Let the backend salt only
					delete obj.auth;

					// OR

					// Salt on the frontend too
					// obj = await create_salt(obj).then(async function(obj) { await resalt_auth(obj.auth, obj.auth, obj); delete obj.auth; delete obj.env_text; document.getElementById("notification").innerHTML += "Backend process launching..."; return obj; }).catch(error => { document.getElementById("error").innerHTML = error; });
				} else {
					obj.auth = obj.env_text; // reinitialize value to keep the value obj.auth non-visible
				}
				console.log("loop i: ", i);
				console.log("x_rand[i]: ", x_rand[i]);
				console.log("obj.auth: ", obj.auth.slice(0,5));
				return obj;
			})
		
		// Advance while loop
		i += 1;	
	}
		
}

// ----------------------------------------------------

async function decode_desalt(obj, i) {
	
	// 0. Decode the Base64-encoded string --> obtain the salted data in binary string format
	const text = atob(obj.env_text);
	
	// 1. 'de-salt' the authorization key read from the file
	if (i == 0) {
		obj.auth = text;
	} else if (i <= obj.n) {
		// remove end
		obj.auth = text.slice(0, text.length-i);
	} else {
		// remove beginning
		obj.auth = text.slice(i-obj.n, text.length);
	}
	return obj;
}

// ----------------------------------------------------

async function create_salt(obj) {

	// Resalt and save the key in .env, for the next time
	var alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var num = '0123456789';
	let alpha_arr = alpha.split('');
	let num_arr = num.split('');

	// --------------------------------
	
	// Determine the salt length - it can be up to length n
	// Configuration 0: [1 to n]
	// first part is [0 to n-1], we do not want 0 so shift it by one [1 to n]
	// var new_salt_length = Math.round(Math.random())*(n-1) + 1;
	// OR
	// Configuration 1: [no_salt to n]
	var new_salt_length = Math.round(Math.random())*n;
	// console.log('new_salt_length: ', new_salt_length);

	// --------------------------------

	if (new_salt_length > 0) {
		// Fill a vector new_salt_length long with 0 or 1; 0=salt a letter, 1=salt a number
		var letnum_selection = [];
		for (let i=0; i<new_salt_length; i++) { 
			letnum_selection.push(Math.round(Math.random())); 
		}
		// console.log('letnum_selection: ', letnum_selection);
	
		// --------------------------------
		
		// Create salt (extra strings randomly)
		obj.salt = letnum_selection.map((row) => { 
	              if (row == 0) { 
	                let val = Math.round(Math.random()*alpha_arr.length);
	                // console.log('val: ', val);
	                return alpha_arr[val]; 
	              } else { 
	                let val = Math.round(Math.random()*num_arr.length);
	                // console.log('val: ', val);
	                return num_arr[val]; 
	              } 
		});
	
		obj.salt = obj.salt.join('');
	} else {
		obj.salt = "";
	}

	return obj;
}

// ----------------------------------------------------

async function resalt_auth(auth, new_auth, obj) {
	
	// Add salt to auth_new
	if (Math.round(Math.random()) == 0) {
		// salt front
		new_auth = obj.salt+new_auth;
	} else {
		// salt back
		new_auth = new_auth+obj.salt;
	}
	delete obj.salt;

	// The key is base64_decoded so that the key is hidden in the file
	await PUT_add_to_a_file_RESTAPI(auth, 'resave the new value', btoa(new_auth), obj.env_desired_path, obj.env_sha);
}

// ----------------------------------------------------
	


// ----------------------------------------------------
// SUBFUNCTIONS
// ----------------------------------------------------


// ----------------------------------------------------
// PUT create a file - Way 0: REST API (WORKS!)
// Can only write to a public repository, can not write to a private repository even if the key grants access
// https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents
// 
// Before, GitHub copied over the temp file with a new temp.
//
// Now, if the file temp exists it does not copy over the file; it gives a 422 error. One needs to delete the file temp and then use this function to create the file temp. 
// ----------------------------------------------------
async function PUT_create_a_file_RESTAPI(auth, message, content, desired_path, repoName) {

	console.log('create desired_path: ', desired_path);
	console.log('create auth: ', auth.slice(0,5));
	
	// PUT content into a new file
	var url = `https://api.github.com/repos/CodeSolutions2/${repoName}/contents/${desired_path}`;
	var data = {"message": message, "committer":{"name":"App name","email":"App email"}, "content": btoa(content)};
	var headers = {"Accept": "application/vnd.github+json", "Authorization": `Bearer ${auth}`, "X-GitHub-Api-Version": "2022-11-28"};
	var options = {method : 'PUT', headers: headers, body : JSON.stringify(data)};
	
	return await fetch(url, options)
		.catch(error => { document.getElementById("error").innerHTML = error; });
}


// ----------------------------------------------------


async function PUT_add_to_a_file_RESTAPI(auth, message, content, desired_path, sha, repoName) {

	console.log('add desired_path: ', desired_path);
	console.log('add auth: ', auth.slice(0,5));
	
	// PUT content into an existing file
	let url = `https://api.github.com/repos/CodeSolutions2/${repoName}/contents/${desired_path}`;
	var data = {"message": message, "committer":{"name":"App name","email":"App email"}, "content": btoa(content), "sha": sha};
	var headers = {"Accept": "application/vnd.github+json", "Authorization": `Bearer ${auth}`, "X-GitHub-Api-Version": "2022-11-28"};
	var options = {method : 'PUT', headers: headers, body : JSON.stringify(data)};
	
	return await fetch(url, options)
		.catch(error => { document.getElementById("error").innerHTML = error; });
}
	
// ----------------------------------------------------

async function GET_text_from_file_wo_auth_GitHub_RESTAPI(desired_filename, repoB_name) {

	// Returns an object of strings
	
	return await GET_fileDownloadUrl_and_sha(desired_filename, repoB_name)
		.then(async function (obj) {
			var text = "";
			if (obj.file_download_url != ["No_file_found"]) {
				// fetch on first file
				text = await fetch(obj.file_download_url[0])
					.then(response => response.text())
					.then(async function(text) { return text; });
			}
			return {text: text, file_download_url: obj.file_download_url[0], sha: obj.sha_arr[0]};
		})
		.catch(error => { document.getElementById("error").innerHTML = error; });
}

// ----------------------------------------------------

async function GET_fileDownloadUrl_and_sha(desired_filename, repoB_name) {

	// Returns an object of values that are an array
	
	var url = `https://api.github.com/repos/CodeSolutions2/${repoB_name}/contents`;
	
	var file_download_url = [];
	var folders = [];
	var sha_arr = [];
	var flag = "run";
	var max_loop_limit = 0;
	
	return await fetch(url)
		.then(res => res.json())
		.then(async function(data) {
			
			while (flag == "run" && max_loop_limit < 5) {
				// search over data for the desired_filename
				var obj = await loop_over_files_and_folders(data, desired_filename, file_download_url, folders, sha_arr);
				
				folders = folders.concat(obj.folders);
				folders = [... new Set(folders)];
				
				file_download_url = file_download_url.concat(obj.file_download_url);
				file_download_url = [... new Set(file_download_url)];
				sha_arr = sha_arr.concat(obj.sha_arr);
				sha_arr = [... new Set(sha_arr)];
				
				// get list of folders from the main directory
				if (folders.length == 0) {
					flag = "stop";
					if (file_download_url.length == 0) { file_download_url = ["No_file_found"]; }
					if (sha_arr.length == 0) { sha_arr = ["No_file_found"]; }
				} else {
					// There are directories in the main file
					data = await fetch(folders.shift())
						.then(res => res.json())
						.then(async function(data) { return data; });
				}
				max_loop_limit += 1;
			}
			return {file_download_url: file_download_url, sha_arr: sha_arr};
		})
		.catch(error => { document.getElementById("error").innerHTML = error; });
	
}

	
async function loop_over_files_and_folders(data, desired_filename, file_download_url, folders, sha_arr) {

	var regexp = new RegExp(`${desired_filename}`, 'g');
	
	// run through files per url directory
	// console.log('data.length: ', data.length);
	
	let i = 0;
	while (i < data.length-1 && i < 10) {
		if (data[i].type === 'file' && data[i].name.match(regexp)) { 
			file_download_url = data[i].download_url;
			sha_arr = data[i].sha;
			// console.log('Desired file found: ', data[i].url);
		} else if (data[i].type === 'dir') {
			// Store url of directories found
			folders.push(data[i].url);
			// console.log('A directory was found: ', data[i].url);
		// } else {
			// console.log('Desired file not found: ', data[i].url);
		}
		i += 1;
		// console.log('i: ', i);
	}
	
	return {file_download_url: file_download_url, folders: folders, sha_arr: sha_arr}; 
}

// ----------------------------------------------------

async function get_number(x) {
	return x[Math.round(x.length*Math.random())-1];
}
	  
async function rand_perm(x) {

	var out = [];
	while (out.length != x.length) {
		out = await get_number(x).then(async function(x_of_y) {
			if (out.includes(x_of_y) == false && typeof x_of_y != "undefined") { 
				out.push(x_of_y);
			}
			return [... new Set(out)]; // ensure that only unique values are stored in out
		});
	}
	
	return out;
	
}  // end of rand_perm

// ----------------------------------------------------
