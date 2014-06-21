
function makeSorter()
{
    function insertion_sort(x)
    {
	var i, j, key;
	for (i = 1; i < x.length; i++) {
	    // Assume x[0..i-1] is sorted. Take x[i] and insert in correct place.
	    key = x[i];
	    j = i-1;
	    while (j >= 0 && x[j] > key) {
		x[j+1] = x[j];
		j--;
	    }
	    x[j+1] = key;
	}
    }

    function selection_sort(x)
    {
	selection_sort_recurse(x, 0, x.length-1);
    }

    function selection_sort_recurse(x, start, end)
    {
	if (start == end) return;
	else {
	    var i, imin = -1, min = Infinity;
	    for (i = start; i <= end; i++) {
		if (x[i] < min) {
		    min = x[i];
		    imin = i;
		}
	    }
	    x[imin] = x[start];
	    x[start] = min;
	    selection_sort_recurse(x, start + 1, end);
	}
    }

    function merge(x, p, q, r, dummy) {
	// merge x[p..q] and x[q+1..r], using dummy as temporary space
	var i, k1 = p, k2 = q+1;
	for (i = p; i <= r; i++) {
	    if (k1 <= q && k2 <= r) {
		// compare first elements of subarrays and choose min
		if (x[k1] < x[k2]) {
		    dummy[i] = x[k1];
		    k1++;
		}
		else {
		    dummy[i] = x[k2];
		    k2++;
		}
	    }
	    else if (k1 == q+1) {
		dummy[i] = x[k2];
		k2++;
	    }
	    else {
		dummy[i] = x[k1];
		k1++;
	    }
	} 
	for (i = p; i <= r; i++) x[i] = dummy[i];
	return;
    }

    function merge_sort(x) 
    {
	var dummy = new Array(x.length);
	merge_sort_recurse(x, 0, x.length-1, dummy);
    }

    function merge_sort_recurse(x, start, end, dummy) 
    {
	if (end == start) return; 
	var p = Math.floor(0.5 * (start + end));
	merge_sort_recurse(x, start, p, dummy);
	merge_sort_recurse(x, p+1, end, dummy);
	merge(x, start, p, end, dummy);
    }

    return { merge : merge_sort, selection : selection_sort, insertion : insertion_sort };
}

Sort = makeSorter();


