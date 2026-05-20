package com.cvcraft.controller;

import com.cvcraft.entity.Bookmark;
import com.cvcraft.repository.BookmarkRepository;
import com.cvcraft.repository.JobPostRepository;
import com.cvcraft.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/bookmarks")
@RequiredArgsConstructor
@Tag(name = "Bookmarks")
@SecurityRequirement(name = "bearerAuth")
public class BookmarkController {

    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final JobPostRepository jobPostRepository;

    @PostMapping("/jobs/{jobId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Bookmark a job")
    public Bookmark bookmarkJob(@PathVariable Long jobId, @AuthenticationPrincipal UserDetails currentUser) {
        var user = userRepository.findByEmail(currentUser.getUsername()).orElseThrow();
        var job = jobPostRepository.findById(jobId).orElseThrow();
        if (bookmarkRepository.existsByUserIdAndJobPostId(user.getId(), jobId)) {
            return bookmarkRepository.findByUserIdAndJobPostId(user.getId(), jobId).orElseThrow();
        }
        return bookmarkRepository.save(Bookmark.builder().user(user).jobPost(job).type(Bookmark.BookmarkType.JOB).build());
    }

    @DeleteMapping("/jobs/{jobId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove job bookmark")
    public void removeJobBookmark(@PathVariable Long jobId, @AuthenticationPrincipal UserDetails currentUser) {
        var user = userRepository.findByEmail(currentUser.getUsername()).orElseThrow();
        bookmarkRepository.deleteByUserIdAndJobPostId(user.getId(), jobId);
    }

    @PostMapping("/candidates/{candidateId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Shortlist a candidate (RECRUITER)")
    public Bookmark bookmarkCandidate(@PathVariable Long candidateId, @RequestParam(required = false) String note, @AuthenticationPrincipal UserDetails currentUser) {
        var user = userRepository.findByEmail(currentUser.getUsername()).orElseThrow();
        var candidate = userRepository.findById(candidateId).orElseThrow();
        if (bookmarkRepository.existsByUserIdAndCandidateId(user.getId(), candidateId)) {
            return bookmarkRepository.findByUserIdAndCandidateId(user.getId(), candidateId).orElseThrow();
        }
        return bookmarkRepository.save(Bookmark.builder().user(user).candidate(candidate).type(Bookmark.BookmarkType.CANDIDATE).note(note).build());
    }

    @DeleteMapping("/candidates/{candidateId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove candidate shortlist")
    public void removeCandidate(@PathVariable Long candidateId, @AuthenticationPrincipal UserDetails currentUser) {
        var user = userRepository.findByEmail(currentUser.getUsername()).orElseThrow();
        bookmarkRepository.deleteByUserIdAndCandidateId(user.getId(), candidateId);
    }

    @GetMapping
    @Operation(summary = "Get my bookmarks (JOB or CANDIDATE)")
    public Page<Bookmark> getBookmarks(
        @RequestParam Bookmark.BookmarkType type,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        var user = userRepository.findByEmail(currentUser.getUsername()).orElseThrow();
        return bookmarkRepository.findByUserIdAndType(user.getId(), type, PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }
}
