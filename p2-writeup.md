# Project 2

## Deadlock & Starvation Analysis

My solution uses several semaphores to prevent race conditions and resource starvation. In this solution, we
keep track of as little shared state as possible, only `tickets` and `visitors`, since we are not allowed to
spin on waiting for these values, they are used only for decision making. That is to say, the variables are used
exclusively to decide if we should `post` a semaphore, or `return` from a thread.

### Mutex Usage

Early on, I found using a mutex as state to be problematic and buggy. My implementation uses two mutex variables,
and these are used **only** to protect critical sections that modify the two state variables, `tickets` and `visitors`, respectively. It is illegal to have one thread lock a mutex and another release it, as well as to have thread exit while holding a lock.

### Semaphores

Instead, we choose to rely only on `sem_wait` to block threads. We model our constraints as _resources_ that guides and
visitors consume and release, depending on their state. We model four resources:

- `guides_allowed` represents the building's capacity for guides
- `visitors_allowed` represents the building's capacity for visitors
- `visitors_waiting` represents the queue outside the building
- `building_empty` represents the whether or not the building has been cleared of visitors.

These four resources allow us to ensure a deadlock and starvation free program by the following rules.

## Visitor Logic

Upon entry, a visitor makes a few decisions. First, it attempts to acquire a ticket.

If unsuccessful, it releases all locks and returns. This decision does not depend upon any state other than tickets. Since all threads lock and unlock the `ticket_mutex` safely and correctly, it will not fail.

With a ticket in hand, the next step is an interesting one. We attempt to acquire the single `building_empty` resource. By using `trywait`, we can hold if and only if the semaphore is not already being held. In other words, only the first visitor will lock this resource. Any subsequent visitors will simply ignore it and continue, as they are not the first to enter.

Then, we add a resource to the `visitors_waiting` queue to indicate to any guide threads that there is a visitor waiting. We also safely increment the `visitors` state variable.

After this, we wait for a `visitors_allowed` resource. Since this resource is initialized to `0`, and only incremented by
the guide thread, we know for certain that no visitor will enter without a guide.

Once we obtain this resource, we enter and begin touring. Upon ending the tour, we leave immediately. Since there are no decencies on this, no deadlocks will occur when a visitor waits for another guide or visitor to leave.

We then safely decrements the `visitors` state variable. This variable is subsequently used to determine if we are the last to leave, in which case issuing a special signal on `building_empty`, which tells any guide threads that the last visitor has left. Since `visitors` is only written to by the visitor thread, and access is protected, it will not cause deaedlocks or spinning.

## Guide Logic

The guide logic is similar, but employs additional checks to ensure all constraints are met.

First, use `is_done` to guard against a guide walking into an empty museum with no tickets remaining. If this happens, release locks and return to avoid deadlocks in this case.

Then, run the `guide_serve` routine. This is a recursive function that: - Checks to see if we have served the max number of guests, if not... - Check to see if `is_done` for the day, preventing starvation where a guest waits endlessly for visitors that will never arrive. - Since `is_done == false` ensures there will be **at least** one more visitor, this avoids a deadlock and lets us safely wait for the `visitors_waiting` resource. - If all the above passes, admit the visitor. - Guides also `post` to the `visitors_allowed` resource, which provides the signaling mechanism for visitors to start - touring. - Recurse again.

Since the two resources modified here are independent and contain no cyclic dependencies, we can ensure no deadlock will occur between touring and admission.

Eventually, `guide_serve` returns and the leave sequence is triggered. We `wait` on the special `building_empty` resources to trigger the guide leaving. Guides immediately post another `building_empty` signal to allow a chain effect on the leaving of guides.

This chain is safe since the first guide waiting already determined that there are no more visitor threads, and thus the only threads `post`-ing until they are gone will be peer guide threads. Once all guides are gone, we have returned to the initial state.

Two helper functions are used: - `is_done` simply checks for the condition of having no visitors waiting AND no tickets left. - `guide_serve` serves a guest until one of the exit conditions are met.
