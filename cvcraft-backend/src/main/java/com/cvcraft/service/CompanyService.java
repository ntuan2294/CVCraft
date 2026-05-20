package com.cvcraft.service;

import com.cvcraft.entity.Company;
import com.cvcraft.exception.BadRequestException;
import com.cvcraft.exception.ResourceNotFoundException;
import com.cvcraft.repository.CompanyRepository;
import com.cvcraft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    @Transactional
    public Company createCompany(Company company, String ownerEmail) {
        var owner = userRepository.findByEmail(ownerEmail).orElseThrow();
        if (companyRepository.existsByOwnerId(owner.getId())) {
            throw new BadRequestException("You already own a company");
        }
        company.setOwner(owner);
        company.setSlug(generateSlug(company.getName()));
        return companyRepository.save(company);
    }

    public Company getBySlug(String slug) {
        return companyRepository.findBySlug(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + slug));
    }

    public Page<Company> search(String keyword, String industry, String location, int page, int size) {
        return companyRepository.searchCompanies(keyword, industry, location,
            PageRequest.of(page, size, Sort.by("name")));
    }

    public List<String> getAllIndustries() {
        return companyRepository.findAllIndustries();
    }

    private String generateSlug(String name) {
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String slug = pattern.matcher(normalized).replaceAll("")
            .toLowerCase().replaceAll("[^a-z0-9\\s-]", "").replaceAll("\\s+", "-");
        if (companyRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }
        return slug;
    }
}
